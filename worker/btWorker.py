from bluepy.btle import Scanner, DefaultDelegate, Peripheral
from PyQt5.QtCore import QThread, pyqtSlot, pyqtSignal, QTimer
import sys
import threading
import time
import socketio
import asyncio
import bldevice

sio = socketio.AsyncClient()


class Main():
    def __init__(self) -> None:
        self.devices = []
        # self.btWorker = BtWorker()
        self.btWorkers = {}
        # self.btWorkers = [BtWorker(d, self.devices) for d in self.devices]

        @sio.on('WORKER:DEVICE_TRY_CONNECT')
        async def onDeviceConnect(data):
            print('on connect', dict(data)['address'])
            address = dict(data)['address']
            device = bldevice.BlDevice(
                1, "", deviceType=bldevice.DeviceTypes.Hydrogen, bleaddr=address)
            self.devices.append(device)
            self.btWorkers[address] = BtWorker(device, self.devices).runOnce()

            # print("workerssss", self.btWorkers)
            # self.btWorkers[address]['device']['address']
            # self.btWorkers.append(address)
            # self.btWorkers
            # self
            # await self.deviceConnect(address)

    async def startServer(self):
        print("starting")
        try:
            await sio.connect('http://localhost:8081', wait_timeout=10)
            await sio.wait()

        except Exception as e:
            await asyncio.sleep(3)
            print('try connect')
            await self.startServer()
        print('connected')


class PeripheralDelegate(DefaultDelegate):
    def __init__(self, device):
        DefaultDelegate.__init__(self)
        # self.logs = logs
        self.data = ""
        self.device = device

    def handleNotification(self, cHandle, data):
        print("RX <<< {}".format(data.decode("ascii")))
        self.data += data.decode("ascii")
        if '\r' not in self.data:
            return
        self.device.updateData(self.data)
        print("DATA UPDATED {}".format(self.data))
        self.data = ""


class BtWorker():
    # logs = pyqtSignal(str)

    def __init__(self, device, devicesList):
        # QThread.__init__(self)
        # self.lock = threading.Lock()
        self.device = device
        self.dname = self.device.btName
        self.devicesList = devicesList
        self.scanner = Scanner()
        self.runIsOnce = False

        self.needClose = False

    # def start(self):
    #     self.run()

    def __del__(self):
        try:
            self.mltDevice.disconnect()
            self.mltDevice = None
        except:
            return

    def connect(self, name):
        #self.device.setStatus(True, "Поиск...")

        devices = self.scanner.scan(3.0)
        mltDevice = None
        bleAddrList = [d.bleAddress for d in self.devicesList]
        print(''.join(bleAddrList))
        for dev in devices:
            print("{} {}dB".format(dev.addr, dev.rssi))
            # for (adtype, desc, value) in dev.getScanData():
            # if adtype==9 and name in value and not dev.addr in bleAddrList: #Complete local name - description
            if self.device.needReconnect and dev.addr == self.device.bleAddress:
                print("reconnected to {}. {}, RSSI={} dB".format(
                    name, dev.addr, dev.rssi))
                mltDevice = dev
                break
            else:
                localname = dev.getValueText(9)
                if localname == None:
                    localname = ""
                if name in localname and not dev.addr in bleAddrList:
                    print("{} finded. {}, RSSI={} dB".format(
                        name, dev.addr, dev.rssi))
                    mltDevice = dev
                    break
        if mltDevice is None:
            self.device.setStatus(False, "Не найдено")
            print("Device not found")
            return False
        self.device.bleAddress = mltDevice.addr
        self.device.addrType = mltDevice.addrType
        self.mltDevice = Peripheral(mltDevice.addr, mltDevice.addrType)
        self.mltDevice.withDelegate(PeripheralDelegate(self.device))
        print("Connected to device")
        self.device.needReconnect = False
        self.device.setStatus(True, "Подключено")
        return True

    def connectSaved(self):
        self.mltDevice = Peripheral(
            self.device.bleAddress, self.device.addrType)
        self.mltDevice.withDelegate(PeripheralDelegate(self.device))

    def writeToDevice(self, message, inHex):
        with self.lock:
            if inHex:
                self.character.write(bytes.fromhex(message))
            else:
                message = message.replace("\\r\\n", "\r\n")
                self.character.write(message.encode('ascii'))

    def stop(self):
        self.needClose = True

    def runOnce(self):
        self.runIsOnce = True
        self.run()
        # self.start()

    def run(self):

        # for i in range(2) :
        #     if self.device.bleAddress == "":
        #         self.device.setStatus(True, "Поиск...")
        #         if not self.connect(self.dname):
        #             self.runIsOnce = False
        #             if i == 1:
        #                 return
        #         break
        #     else:
        #         try:
        #             self.connectSaved()
        #             break
        #         except Exception as e:
        #             self.device.bleAddress = ""
        #             self.runIsOnce = False
        #             self.device.setStatus(False, "Ошибка")
        #             print("Ошибка при подключении к устройству.")
        #             print(str(e))
        #             if i == 1:
        #                 return

        if self.device.bleAddress == "" or self.device.needReconnect:
            self.device.setStatus(True, "Поиск...")
            if not self.connect(self.dname):
                self.runIsOnce = False
                return
        else:
            try:
                self.connectSaved()
                self.device.setStatus(True, "Подключено")
            except Exception as e:
                self.device.needReconnect = True
                self.runIsOnce = False
                self.device.setStatus(False, "Ошибка")
                print("Ошибка при подключении к устройству.", e)
                # print(str(e))
                return

        endtime = time.monotonic() + 10
        while not self.needClose:

            if self.runIsOnce and endtime < time.monotonic():
                self.mltDevice = None
                self.runIsOnce = False
                self.device.setStatus(False, "Ошибка")
                print("Ошибка при чтении данных.")
                return

            try:
                self.mltDevice.waitForNotifications(0.5)

                if self.device.isDataReceived:
                    self.mltDevice.disconnect()
                    self.device.resetIsDataReceived()

                    if self.runIsOnce:
                        self.mltDevice = None
                        self.runIsOnce = False
                        return

                    time.sleep(1)
                    self.connectSaved()

            except Exception as e:
                print(str(e))
                try:
                    self.mltDevice.disconnect()
                except:
                    pass
                if self.runIsOnce:
                    self.mltDevice = None
                    self.runIsOnce = False
                    return
                print(str(e))
                print("Device disconnected")
                self.device.setStatus(False, "Отключено")
                break
        if self.needClose:
            print("Device disconnected")
            self.device.setStatus(False, "Отключено")
            self.needClose = False
            self.mltDevice.disconnect()


if __name__ == '__main__':
    # app = QApplication(sys.argv)
    # w = Ui()
    # w.showMaximized()
    # sys.exit(app.exec_())
    main = Main()
    asyncio.run(main.startServer())
