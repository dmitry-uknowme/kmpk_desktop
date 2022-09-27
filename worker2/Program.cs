using SocketIOClient;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Windows.Devices.Bluetooth;
using Windows.Devices.Bluetooth.Advertisement;
using Windows.Devices.Bluetooth.GenericAttributeProfile;
using Windows.Devices.Enumeration;
using Windows.Devices.Radios;
using Windows.Storage.Streams;
using System.Web.Script.Serialization;
using System.Timers;
using System.Net;
using Timer = System.Timers.Timer;
using nexus.core;

namespace QuickBlueToothLE
{
    
    class DeviceData
    {
        public dynamic T { get; set; }
        public dynamic H2 { get; set; }
        public dynamic PH { get; set; }
        public dynamic Moi { get; set; }
        public dynamic La { get; set; }
        public dynamic Lo { get; set; }
        public dynamic Ti { get; set; }
    }

    class DeviceDataRecievePayload
    {
        public string address { get; set; }
        public DeviceData data { get; set; }
        public TimeSpan timeConnected {get; set;}
    }

    class DeviceTryConnectPayload
    {
        public string address { get; set; }
    }
    class DeviceConnectedPayload
    {
        public string address { get; set; }
    }

    class Program
    {
        static DeviceInformation device = null;
        private static Dictionary<string, string> devicesDataString = new Dictionary<string, string>(); 
        private static List<BluetoothLEDevice> devices;
        private static List<string> connectedDevicesAddresses = new List<string>();
        private static Dictionary<string,DateTime> connectedDevicesTimes = new Dictionary<string,DateTime>();
        private static List<string> devicesAddresses = new List<string>();
        public static readonly Guid SERVICE_UUID = Guid.Parse("0000ffe0-0000-1000-8000-00805f9b34fb");
        private static readonly SocketIO socketIOClient = new SocketIO("http://localhost:8081/");

        static async Task Main(string[] args)
        {
            devicesAddresses.Add("88:4A:EA:92:1D:43");
            devicesAddresses.Add("00:15:87:00:B7:E2");

            await socketIOClient.ConnectAsync(); 
            Console.WriteLine("initt", socketIOClient.ServerUri);

            socketIOClient.On("WORKER:DEVICE_TRY_CONNECT", (payload) => {
                DeviceTryConnectPayload deviceTryConnectPayload = payload.GetValue<DeviceTryConnectPayload>();
                string address = deviceTryConnectPayload.address;
                TryDeviceConnect(address);
            });

            socketIOClient.On("WORKER:DEVICE_TRY_DISCONNECT", async(payload) => {
                DeviceTryConnectPayload deviceTryConnectPayload = payload.GetValue<DeviceTryConnectPayload>();
                string address = deviceTryConnectPayload.address;
                connectedDevicesAddresses.Remove(address);
                string deviceDisconnectedJson = JsonSerializer.Serialize(new DeviceConnectedPayload { address = address });
                await socketIOClient.EmitAsync("WORKER:DEVICE_DISCONNECTED", deviceDisconnectedJson);
            });


            // Query for extra properties you want returned
            string[] requestedProperties = { "System.Devices.Aep.DeviceAddress", "System.Devices.Aep.IsConnected" };

            DeviceWatcher deviceWatcher =
                        DeviceInformation.CreateWatcher(
                                BluetoothLEDevice.GetDeviceSelectorFromPairingState(false),requestedProperties,
                                DeviceInformationKind.AssociationEndpoint);

            // Register event handlers before starting the watcher.
            // Added, Updated and Removed are required to get all nearby devices
            deviceWatcher.Added += DeviceWatcher_Added;
            deviceWatcher.Updated += DeviceWatcher_Updated;
            deviceWatcher.Removed += DeviceWatcher_Removed;

            // EnumerationCompleted and Stopped are optional to implement.
            deviceWatcher.EnumerationCompleted += DeviceWatcher_EnumerationCompleted;
            deviceWatcher.Stopped += DeviceWatcher_Stopped;

            // Start the watcher.
            deviceWatcher.Start();
            Console.WriteLine("da");
            //TryDeviceConnect(devicesAddresses[1]);
            //TryDeviceConnect(devicesAddresses[0]);
            Console.ReadKey();
            deviceWatcher.Stop();
        }

        private static string ConvertMacAddressToString(ulong macAddress)
        {
            return string.Join(":",
                        BitConverter.GetBytes(macAddress).Reverse()
                        .Select(b => b.ToString("X2"))).Substring(6);
        }

        private static ulong ConvertMacAddressToInt(string macAddress)
        {
            string hex = macAddress.Replace(":", "");
            return Convert.ToUInt64(hex, 16);
        }

        private static async void TryDeviceConnect(string address)
        {
            while (true)
            {
                    //Console.WriteLine("No Sleep " + device.Id);
                    //Console.WriteLine("Press Any to pair " + address);
                    //Console.ReadKey();

                    BluetoothLEDevice bluetoothLeDevice = await BluetoothLEDevice.FromBluetoothAddressAsync(ConvertMacAddressToInt(address));
                    if (bluetoothLeDevice == null)
                    {
                        Console.WriteLine("No device found with address " + address);
                        return;
                    }
                    Console.WriteLine("Attempting to pair with device");
                    //Console.WriteLine("dd " + bluetoothLeDevice.DeviceId.ToString());
                    GattDeviceServicesResult result = await bluetoothLeDevice.GetGattServicesAsync();

                    if (result.Status == GattCommunicationStatus.Success)
                    {
                        Console.WriteLine("Pairing succeeded");

                        connectedDevicesAddresses.Add(address);
                        DateTime connectionStartTime = DateTime.Now;
                        connectedDevicesTimes[address] = connectionStartTime;
                        string deviceConnectedJson = JsonSerializer.Serialize(new DeviceConnectedPayload { address = address });
                        await socketIOClient.EmitAsync("WORKER:DEVICE_CONNECTED", deviceConnectedJson);
                        var services = result.Services;
                        foreach (var service in services)
                        {
                            if (service.Uuid.Equals(SERVICE_UUID))
                            {
                                service.Session.SessionStatusChanged += Service_SessionStatusChanged;
                                Console.WriteLine("Found service");
                                GattCharacteristicsResult charactiristicResult = await service.GetCharacteristicsAsync();

                                if (charactiristicResult.Status == GattCommunicationStatus.Success)
                                {
                                    var characteristics = charactiristicResult.Characteristics;
                                    foreach (var characteristic in characteristics)
                                    {
                                        Console.WriteLine("---------------");
                                        Console.WriteLine(characteristic);
                                        GattCharacteristicProperties properties = characteristic.CharacteristicProperties;

                                        if (properties.HasFlag(GattCharacteristicProperties.Notify))
                                        {
                                            Console.WriteLine("Notify property found");
                                            //characteristic.ReadClientCharacteristicConfigurationDescriptorAsync();
                                            GattCommunicationStatus status = await characteristic.WriteClientCharacteristicConfigurationDescriptorAsync(
                        GattClientCharacteristicConfigurationDescriptorValue.Notify);
                                            if (status == GattCommunicationStatus.Success)
                                            {
                                                characteristic.ValueChanged += Characteristic_ValueChanged;
                                                // Server has been informed of clients interest.
                                            }
                                        }

                                    }
                                }
                            }
                        }
                    }

                    Console.WriteLine("Press Any Key to Exit application");
                    Console.ReadKey();
                    break;
            }
        } 

        private static async void Service_SessionStatusChanged(GattSession gattSession, GattSessionStatusChangedEventArgs args)
        {
            BluetoothLEDevice bluetoothLeDevice = await BluetoothLEDevice.FromIdAsync(gattSession.DeviceId.Id);
            Console.WriteLine("Status changed " + args.Status.ToString() + " args " + JsonSerializer.Serialize(args) + "d" + JsonSerializer.Serialize(bluetoothLeDevice));

            string address = ConvertMacAddressToString(bluetoothLeDevice.BluetoothAddress);

            if (args.Status == GattSessionStatus.Closed)
            {
                string deviceDisconnectedJson = JsonSerializer.Serialize(new DeviceConnectedPayload { address = address });
                await socketIOClient.EmitAsync("WORKER:DEVICE_DISCONNECTED", deviceDisconnectedJson);
            }
        }

        private static async void Characteristic_ValueChanged(GattCharacteristic sender, GattValueChangedEventArgs args)
        {
            
            //string convertedAddress = ConvertMacAddressToString(sender.Service.Device.BluetoothAddress);
            string convertedAddress = ConvertMacAddressToString(sender.Service.Device.BluetoothAddress);

            if (!connectedDevicesAddresses.Contains(convertedAddress))
            {
                sender.Service.TryDispose();
                return;
            }

                string dataStr = "";
            
            try
            {
                var reader = DataReader.FromBuffer(args.CharacteristicValue);
                int i = 0;
                string partStr = "";
                Dictionary<string, string> dict = new Dictionary<string, string>();
                while (i < args.CharacteristicValue.Length)
                {
                    partStr += (char) reader.ReadByte();
                    i++;
                }
                    string str = devicesDataString.Get(convertedAddress) + partStr;
                    devicesDataString[convertedAddress] = str;
/*                    Console.WriteLine("Raw str " + partStr + " address " + convertedAddress);
                    Console.WriteLine("Full str " + str + " address " + convertedAddress);*/

                if (partStr.Contains("\r\n"))
                {
                    string[] dataArray = devicesDataString[convertedAddress].Split(',');

                    //dataArray.ToDictionary<string, string>(x => x.Split('=')[0], x => x.Split('=')[1]);
                    //Console.WriteLine("Arr " + JsonSerializer.Serialize(dataArray));
                    for (int k = 0; k < dataArray.Length; k++)
                    {
                        string key = dataArray[k].Split('=')[0];
                        string value = dataArray[k].Split('=')[1];
                        dict[key.Replace("\n", "").Trim()] = value.Replace("\r", "").Replace("\n", "").Replace("+", "").Replace("ppm", "").Trim();
                    }

                    //Console.WriteLine("Prev data " + JsonSerializer.Serialize(dict) + " From device " + convertedAddress);

                    DeviceData deviceData = new DeviceData() {
                        T = dict["T"],
                        H2 = dict["H2"],
                        PH = dict["PH"].Split(' ')[0],
                        Moi = dict["Moi"].Split(' ')[0],
                        La = dict["La"],
                        Lo = dict["Lo"],
                        Ti = dict["Ti"],
                    };
                    
                    DateTime connectionStartTime = connectedDevicesTimes[convertedAddress];
                    string deviceDataRecieveJson = JsonSerializer.Serialize(new DeviceDataRecievePayload() { address=convertedAddress, data= deviceData, timeConnected=connectionStartTime - DateTime.Now });
                     
                    Console.WriteLine("Data " + deviceDataRecieveJson + " From device " + convertedAddress);
                    await socketIOClient.EmitAsync("WORKER:DEVICE_DATA_RECIEVE", deviceDataRecieveJson);
                    devicesDataString[convertedAddress] = "";
                }
            }
            catch (Exception e) {
                Console.WriteLine("Unable to parse " + e.ToString() + " Address " + convertedAddress);
                devicesDataString[convertedAddress] = "";
            }
        }

        private static void DeviceWatcher_Stopped(DeviceWatcher sender, object args)
        {
            //throw new NotImplementedException();
        }

        private static void DeviceWatcher_EnumerationCompleted(DeviceWatcher sender, object args)
        {
            //throw new NotImplementedException();
        }

        private static void DeviceWatcher_Removed(DeviceWatcher sender, DeviceInformationUpdate args)
        {
            //throw new NotImplementedException();
        }

        private static void DeviceWatcher_Updated(DeviceWatcher sender, DeviceInformationUpdate args)
        {
            //throw new NotImplementedException();
        }

        private static void DeviceWatcher_Added(DeviceWatcher sender, DeviceInformation args)
        {
            Console.WriteLine(args.Name);
            if (args.Name == "BBB01")
                device = args;
            //throw new NotImplementedException();
        }
    }
}
