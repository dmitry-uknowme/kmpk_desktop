from PyQt5.QtCore import pyqtSlot, pyqtSignal, QObject
from collections import deque
import time
import threading
from datetime import datetime
from enum import Enum
import os
import socketio


class DeviceTypes(Enum):
    Hydrogen = 1
    Ground = 2


class BlDevice(QObject):
    statusChanged = pyqtSignal()
    dataUpdated = pyqtSignal()

    def __init__(self, deviceNum, dataFileName, deviceType=DeviceTypes.Hydrogen, bleaddr="", socketIO=""):
        QObject.__init__(self)
        self.socketIO = socketIO
        self.status = "Отключен"
        self.isconnected = False
        self.working = False

        self.measureNum = 1

        self.deviceNum = deviceNum

        self.flock = threading.Lock()
        self.dataFileName = dataFileName

        self.dataNums = deque(maxlen=500)
        self.dataValue = deque(maxlen=500)

        self.isDataReceived = False

        self.ignoreData = False

        self.deviceType = deviceType
        if self.deviceType == DeviceTypes.Hydrogen:
            self.btName = "BT05"
        else:
            self.btName = "BBB01"

        self.bleAddress = bleaddr
        self.addrType = "public"

        self.needReconnect = self.bleAddress == ""

        self.temp = "0"
        self.h2 = "0"
        self.ph = "0"
        self.moi = "0"

        self.maxH2 = 0
        self.minH2 = 0

        self.time = "00:00:00"
        self.timeLoaded = False

        self.Lat = "0"
        self.Long = "0"

        # self.writeDevTypeToFile()

    def writeDevTypeToFile(self):
        with open(self.dataFileName, 'a') as f:
            f.write(str(self.deviceType) + ";" + str(self.deviceNum) + ";\r\n")
            f.flush()

    def writeDataToFile(self):
        with open(self.dataFileName, 'a') as f:
            f.seek(0, 2)
            if f.tell() == 0:
                f.write(str(self.deviceType) + ";" +
                        str(self.deviceNum) + ";\r\n")
            s = datetime.now().isoformat() + ";"
            if self.deviceType == DeviceTypes.Hydrogen:
                s += str(self.h2) + ";" + str(self.temp) + ";"
            elif self.deviceType == DeviceTypes.Ground:
                s += str(self.temp) + ";" + str(self.ph) + \
                    ";" + str(self.moi) + ";"
            s += self.Lat + ";" + self.Long + ";\r\n"
            f.write(s)
            f.flush()

    def setIgnoreData(self, ignore):
        with self.flock:
            self.ignoreData = ignore

    def setStatus(self, isConnected, status):
        print("status", isConnected, status, self.bleAddress)
        self.status = status
        self.isconnected = isConnected
        self.statusChanged.emit()

    def setWorking(self, wokring):
        self.working = wokring
        if not self.working:
            self.isconnected = False
            #self.bleAddress = ""
        # else:
        #     if not os.path.exists(self.dataFileName):
        #         self.writeDevTypeToFile()

    def updateData(self, data):
        with self.flock:
            if self.ignoreData:
                return
            self.strData = data
    #  T = dict["T"],
    #                     H2 = dict["H2"],
    #                     PH = dict["PH"].Split(' ')[0],
    #                     Moi = dict["Moi"].Split(' ')[0],
    #                     La = dict["La"],
    #                     Lo = dict["Lo"],
    #                     Ti = dict["Ti"],

            tmp = dict(s.split("=") for s in data.split(","))
            self.temp = tmp["T"]
            self.h2 = tmp["H2"].replace("ppm", "")
            self.ph = tmp["PH"].split(" ")[0]
            self.moi = tmp["Moi"].split(" ")[0]
            self.Lat = tmp["La"]
            self.Long = tmp["Lo"]
            ti = tmp["Ti"].replace(" ", "").split(".")[0]
            if str.isdecimal(ti):
                try:
                    self.time = ti[:2] + ":" + ti[2:4] + ":" + ti[4:6]
                    self.timeLoaded = True
                except:
                    self.timeLoaded = False
            else:
                self.timeLoaded = False
            # self.writeDataToFile()
            self.dataNums.append(self.measureNum)
            self.measureNum += 1
            self.dataValue.append(float(self.h2))

            self.maxH2 = max(self.dataValue)
            self.minH2 = min(self.dataValue)

            self.isDataReceived = True
            print("tmp", tmp)
            self.socketIO.emit("WORKER:DEVICE_DATA_RECIEVE", tmp)
            # self.dataUpdated.emit()

    def resetIsDataReceived(self):
        self.isDataReceived = False
