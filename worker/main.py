

# import socketio
# import sys
# import time
# import platform
# import asyncio
# import logging

# from bleak import BleakClient, BleakScanner
# from bleak.backends.scanner import AdvertisementData, BLEDevice

# logger = logging.getLogger(__name__)


# # ADDRESSES = ["00:15:87:00:B7:E2"]
# ADDRESSES = ["98:7B:F3:5F:66:D6"]
# # ADDRESSES = ["20:C3:8F:BE:B3:1B"]
# ADDRESS = "20:C3:8F:BE:B3:1B"
# # ADDRESS="C4:BE:84:54:98:BF"
# SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb"
# CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb"


# sio = socketio.AsyncClient()

# # global pointNumber


# async def run_ble_client(address: str, char_uuid: str, queue: asyncio.Queue):
#     async def callback_handler(sender, data):
#         try:
#             await queue.put((time.time(), data, address))
#         except Exception as e:
#             print('disconn', e)
#             await sio.emit('WORKER:DEVICE_DISCONNECTED', {"address": address})
#             pointNumber = pointNumber + 1
#     try:
#         async with BleakClient(address, timeout=10.0) as client:
#             logger.info(f"Connected: {client.is_connected}")
#             await sio.emit('WORKER:DEVICE_CONNECTED', {"address": address, "pointNumber": pointNumber})
#             # pointNumber += 1
#             while True:
#                 await client.start_notify(char_uuid, callback_handler)
#                 await asyncio.sleep(15)
#     except Exception as e:
#         print('disconn2', e)
#         await sio.emit('WORKER:DEVICE_DISCONNECTED', {"address": address})
#         pointNumber = pointNumber + 1


# async def run_queue_consumer(queue: asyncio.Queue):
#     tempData = ""
#     prevData = ""
#     while True:
#         epoch, data, address = await queue.get()
#         if data is None:
#             logger.info(
#                 "Got message from client about disconnection. Exiting consumer loop..."
#             )
#             break
#         else:
#             # logger.info(
#             #     f"Received callback data via async queue at {epoch}: {data}")
#             if (data == prevData):
#                 continue
#             prevData = data
#             tempData += data.decode("ascii")
#             if '\r' not in tempData:
#                 continue
#             tempData = tempData.replace(',Ti=', '')
#             print('ttttt', tempData, 'addd', address)

#             # for s in tempData.split(","):
#             #     print('ssssss', s)
#             #     print('sssss23', s.split('='))
#             tmp = dict(s.split("=") for s in tempData.split(","))
#             # obj = dict
#             # tempData.temp = tmp["T"]
#             # tempData.h2 = tmp["H2"].replace("ppm", "")
#             # obj.ph = tmp["PH"].split(" ")[0]
#             # obj.moi = tmp["Moi"].split(" ")[0]
#             # obj.Lat = tmp["La"]
#             # obj.Long = tmp["Lo"]
#             await sio.emit('WORKER:DEVICE_DATA_RECIEVE', {"address": address, "data": tmp})
#             tempData = ""


# async def main(address: str, char_uuid: str):
#     tasks = []
#     for address in ADDRESSES:
#         queue = asyncio.Queue()
#         client_task = run_ble_client(address, char_uuid, queue)
#         consumer_task = run_queue_consumer(queue)
#         tasks.append(asyncio.gather(client_task, consumer_task))
#         await asyncio.sleep(2)
#         # await asyncio.gather(client_task, consumer_task)
#         logger.info("Main method done.")
#     await asyncio.gather(*tasks)


# async def deviceConnect(address: str):
#     pointNumber = 1
#     queue = asyncio.Queue()
#     client_task = run_ble_client(address, CHARACTERISTIC_UUID, queue)
#     consumer_task = run_queue_consumer(queue)
#     asyncio.gather(client_task, consumer_task)
#     # await asyncio.sleep(2)
#     logger.info("Main method done.")

# # loop2 = asyncio.get_event_loop()
# pointNumber = 1


# @sio.on('WORKER:DEVICE_TRY_CONNECT')
# async def onDeviceConnect(data):
#     global pointNumber = 1
#     print('on connect', dict(data)['address'])
#     address = dict(data)['address']
#     await deviceConnect(address)
#     # loop2.run_until_complete(deviceConnect(address))
#     # asyncio.run(deviceConnect(address))


# async def startServer():
#     pointNumber = 1
#     await sio.connect('http://localhost:8081')
#     await sio.wait()

# if __name__ == '__main__':
#     pointNumber = 1
#     asyncio.run(startServer())

# # if __name__ == "__main__":
# #     prevData = ""
# #     tempData = ""
# #     logging.basicConfig(level=logging.INFO)
# #     asyncio.run(
# #         main(
# #             sys.argv[1] if len(sys.argv) > 1 else ADDRESS,
# #             sys.argv[2] if len(sys.argv) > 2 else CHARACTERISTIC_UUID,
# #         )
# #     )


import socketio
import sys
import time
import platform
import asyncio
import logging

from bleak import BleakClient, BleakScanner
from bleak.backends.scanner import AdvertisementData, BLEDevice

logger = logging.getLogger(__name__)


# ADDRESSES = ["00:15:87:00:B7:E2"]
ADDRESSES = ["98:7B:F3:5F:66:D6"]
# ADDRESSES = ["20:C3:8F:BE:B3:1B"]
ADDRESS = "20:C3:8F:BE:B3:1B"
# ADDRESS="C4:BE:84:54:98:BF"
SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb"
CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb"


sio = socketio.AsyncClient()

# global pointNumber


class BtWorker():
    def __init__(self):
        self.pointNumber = 1
        self.detectedDevices = []

        @sio.on('WORKER:DEVICE_TRY_CONNECT')
        async def onDeviceConnect(data):
            print('on connect', dict(data)['address'])
            address = dict(data)['address']
            await self.deviceConnect(address)
            await sio.emit("WORKER:DEVICE_DATA_RECIEVE", "dadadad")

        @sio.on('WORKER:DEVICE_TRY_DISCONNECT')
        async def onDeviceDisconnect(data):
            print('on disconnect', dict(data)['address'])
            address = dict(data)['address']
            await self.deviceDisconnect(address)

    async def run_ble_client(self, address: str, char_uuid: str, queue: asyncio.Queue):
        async def callback_handler(sender, data):
            try:
                await queue.put((time.time(), data, address))
            except Exception as e:
                print('Устройство ' + address +
                      ' отключено.' + ' Ошибка: ' + str(e))
                await sio.emit('WORKER:DEVICE_DISCONNECTED', {"address": address})
                self.pointNumber = self.pointNumber + 1
        try:
            async with BleakClient(address, timeout=10.0) as client:
                if (client.is_connected):
                    await client.disconnect()
                logger.info(f"Connected: {client.is_connected}")
                # self.detectedDevices.append({"address":address, "number":})
                await sio.emit('WORKER:DEVICE_CONNECTED', {"address": address, "pointNumber": self.pointNumber})
                self.pointNumber = self.pointNumber + 1
                while True:
                    if (not client.is_connected):
                        await client.connect()
                    await client.start_notify(char_uuid, callback_handler)
                    await asyncio.sleep(15)
        except Exception as e:
            print('Устройство ' + address + ' отключено.' + ' Ошибка: ' + str(e))
            await sio.emit('WORKER:DEVICE_DISCONNECTED', {"address": address})
            # await self.deviceDisconnect(address)
            await asyncio.sleep(10)
            await self.deviceConnect(address)
            self.pointNumber = self.pointNumber + 1

    async def run_queue_consumer(self, queue: asyncio.Queue):
        tempData = ""
        prevData = ""
        while True:
            epoch, data, address = await queue.get()
            if data is None:
                logger.info(
                    "Got message from client about disconnection. Exiting consumer loop..."
                )
                break
            else:
                # logger.info(
                #     f"Received callback data via async queue at {epoch}: {data}")
                try:
                    if (data == prevData):
                        continue
                    prevData = data
                    tempData += data.decode("ascii")
                    if '\r' not in tempData:
                        continue
                    print('Полученные данные:', tempData,
                          'Устройство:', address)

                    tmp = dict(s.split("=") for s in tempData.split(","))
                    obj = dict()

                    if 'T' in tmp:
                        obj['temp'] = tmp["T"]
                    else:
                        obj['temp'] = ""
                    # obj['temp'] = tmp["T"] ? tmp['T']:""
                    obj['h2'] = tmp["H2"].replace("ppm", "")
                    # obj['maxH2']= float(tmp["H2"].replace("ppm", ""))

                    if (tmp["PH"].split(" ")[0]):
                        obj['ph'] = tmp["PH"].split(" ")[0]
                    obj['moi'] = tmp["Moi"].split(" ")[0]
                    obj['Lat'] = tmp["La"]
                    obj['Long'] = tmp["Lo"]
                    # if (obj['h2'] > obj['maxH2'] or not obj['maxH2']):
                    #     obj['maxH2'] = obj['h2']

                    await sio.emit('WORKER:DEVICE_DATA_RECIEVE', {"address": address, "data": obj, "pointNumber": self.pointNumber})

                except Exception as e:
                    print('unable to parse', e)
                    tempData = ""
                    continue
                tempData = ""
    # async def main(address: str, char_uuid: str):
    #     tasks = []
    #     for address in ADDRESSES:
    #         queue = asyncio.Queue()
    #         client_task = self.run_ble_client(address, char_uuid, queue)
    #         consumer_task = self.run_queue_consumer(queue)
    #         tasks.append(asyncio.gather(client_task, consumer_task))
    #         await asyncio.sleep(2)
    #         # await asyncio.gather(client_task, consumer_task)
    #         logger.info("Main method done.")
    #     await asyncio.gather(*tasks)

    async def deviceConnect(self, address: str):
        pointNumber = 1
        queue = asyncio.Queue()
        client_task = self.run_ble_client(address, CHARACTERISTIC_UUID, queue)
        consumer_task = self.run_queue_consumer(queue)
        asyncio.gather(client_task, consumer_task)
        logger.info("Main method done.")

    async def deviceDisconnect(self, address: str):
        async with BleakClient(address, timeout=10.0) as client:
            if (client.is_connected):
                await client.stop_notify(CHARACTERISTIC_UUID)
                await client.disconnect()
                logger.info(f"Disconnected: {client.is_connected}")
                await sio.emit('WORKER:DEVICE_DISCONNECTED', {"address": address, "pointNumber": self.pointNumber})

    async def startServer(self):
        try:
            pointNumber = 1
            await sio.connect('http://localhost:8081', wait_timeout=10)
            await sio.wait()
        except Exception as e:
            await asyncio.sleep(3)
            print('try connect')
            await self.startServer()


if __name__ == '__main__':
    worker = BtWorker()

    # pointNumber = 1
    asyncio.run(worker.startServer())

# if __name__ == "__main__":
#     prevData = ""
#     tempData = ""
#     logging.basicConfig(level=logging.INFO)
#     asyncio.run(
#         main(
#             sys.argv[1] if len(sys.argv) > 1 else ADDRESS,
#             sys.argv[2] if len(sys.argv) > 2 else CHARACTERISTIC_UUID,
#         )
#     )
