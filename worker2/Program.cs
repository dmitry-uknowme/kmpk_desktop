using SocketIOClient;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Windows.Devices.Bluetooth;
using Windows.Devices.Bluetooth.GenericAttributeProfile;
using Windows.Devices.Enumeration;
using Windows.Storage.Streams;
using nexus.core;
using System.Collections;
using System.Diagnostics;
using Windows.Media.Protection.PlayReady;
using System.Threading;

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

    enum DeviceType    
    {
        Hydrogen = 0,
        Ground = 1,
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
        private static readonly SocketIO socketIOClient = new SocketIO("http://localhost:8081/", new SocketIOOptions()
        {
            Query = new List<KeyValuePair<string, string>>
            {
                new KeyValuePair<string, string>("name", "worker")
            }
        });

        static async Task Main(string[] args)
        {
            Console.WriteLine("PID: " + Process.GetCurrentProcess().Id);
            // Query for extra properties you want returned
            string[] requestedProperties = { "System.Devices.Aep.DeviceAddress", "System.Devices.Aep.IsConnected" };

            DeviceWatcher deviceWatcher =
                        DeviceInformation.CreateWatcher(
                                BluetoothLEDevice.GetDeviceSelectorFromPairingState(false), requestedProperties,
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
           



            socketIOClient.OnDisconnected +=  async(sender, e) =>
            {
                deviceWatcher.Stop();
                Thread.Sleep(1000);
                Environment.Exit(0);
            };

            Console.ReadLine();
            deviceWatcher.Stop();
        }

        private static void ExitApp(string str)
        {
            Environment.Exit(0);
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
            try {
                while (true)
                {
                    BluetoothLEDevice bluetoothLeDevice = await GetBluetoothDeviceByAddress(address);
                    if (bluetoothLeDevice == null)
                    {
                        return;
                    }
                    Console.WriteLine("Attempting to pair device with address" + address);
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

                    else
                    {
                        string deviceDisconnectedJson = JsonSerializer.Serialize(new DeviceConnectedPayload { address = address });
                        await socketIOClient.EmitAsync("WORKER:DEVICE_DISCONNECTED", deviceDisconnectedJson);
                    }

                    Console.WriteLine("Press Any Key to Exit application");
                    Console.ReadLine();
                    break;
                }
            }
            catch (Exception ex) { 
                Console.WriteLine("Unexpected error " + ex.ToString()); 
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
                    
                    //Console.WriteLine("T: " + float.Parse("0.0"));

                    //Console.WriteLine("Prev data " + JsonSerializer.Serialize(dict) + " From device " + convertedAddress);
                    /*Console.WriteLine("T: " + float.Parse(dict["T"]) + " H2: " + float.Parse(dict["H2"]) + "PH: " + float.Parse(dict["PH"].Split(' ')[0]) + " Moi" + float.Parse(dict["Moi"].Split(' ')[0]));*/
                    DeviceData deviceData = new DeviceData() {
                        /*                        T = float.Parse(dict["T"]),
                                                H2 = float.Parse(dict["H2"]),
                                                PH = float.Parse(dict["PH"].Split(' ')[0]),
                                                Moi = float.Parse(dict["Moi"].Split(' ')[0]), */
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
                var reader = DataReader.FromBuffer(args.CharacteristicValue);
                int i = 0;
                string partStr = "";
                while (i < args.CharacteristicValue.Length)
                {
                    partStr += (char)reader.ReadByte();
                    i++;
                }
                Console.WriteLine("Unable to parse " + e.ToString() + " Address " + convertedAddress + " Data " + partStr);
                devicesDataString[convertedAddress] = "";
            }
        }


        private static async Task<BluetoothLEDevice> GetBluetoothDeviceByAddress(string address)
        {
            string deviceDisconnectedJson = JsonSerializer.Serialize(new DeviceConnectedPayload { address = address });
            try
            {
                BluetoothLEDevice bluetoothLEDevice = await BluetoothLEDevice.FromBluetoothAddressAsync(ConvertMacAddressToInt(address));
                if (bluetoothLEDevice == null)
                {
                    Console.WriteLine("No device found with address " + address);
                    
                    await socketIOClient.EmitAsync("WORKER:DEVICE_DISCONNECTED", deviceDisconnectedJson);
                    return null;
                }
                return bluetoothLEDevice;
            }
            catch (Exception ex)
            {
                Console.WriteLine("No device found with address " + address + "Error: " + ex.Message.ToString());
                await socketIOClient.EmitAsync("WORKER:DEVICE_DISCONNECTED", deviceDisconnectedJson);
                return null;
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
