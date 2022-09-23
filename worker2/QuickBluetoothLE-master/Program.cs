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
using SocketIOClient;
using System.Web.Script.Serialization;

namespace QuickBlueToothLE
{
    class DeviceTryConnectPayload
    {
        public string address { get; set; }
    }
    class DeviceConnectedData
    {
        public string address { get; set; }
    }

    class Program
    {
        static DeviceInformation device = null;
        private static List<BluetoothLEDevice> devices;
        private static List<string> devicesAddresses = new List<string>();
        public static readonly Guid SERVICE_ID = Guid.Parse("0000ffe0-0000-1000-8000-00805f9b34fb");
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

                if (device == null)
                {
                    Console.WriteLine("Sleep ");
                    Thread.Sleep(200);
                }
                else
                {
                    Console.WriteLine("No Sleep " + device.Id);
                    Console.WriteLine("Press Any to pair ");
                    //Console.ReadKey();
                    BluetoothLEDevice bluetoothLeDevice = await BluetoothLEDevice.FromBluetoothAddressAsync(ConvertMacAddressToInt(address));
                    Console.WriteLine("Attempting to pair with device");
                    //Console.WriteLine("dd " + bluetoothLeDevice.DeviceId.ToString());
                    GattDeviceServicesResult result = await bluetoothLeDevice.GetGattServicesAsync();

                    if (result.Status == GattCommunicationStatus.Success)
                    {
                        Console.WriteLine("Pairing succeeded");
                        string deviceConnectedJson = JsonSerializer.Serialize(new DeviceConnectedData { address = address });
                        Console.WriteLine("JSON " + deviceConnectedJson);
                        await socketIOClient.EmitAsync("WORKER:DEVICE_CONNECTED", deviceConnectedJson);
                        /*await socketIOClient.EmitAsync("WORKER:DEVICE_CONNECTED", $@"{{'address': '{address}'}}");*/
                        var services = result.Services;
                        foreach (var service in services)
                        {
                            if (service.Uuid.Equals(SERVICE_ID))
                            {
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
                                            Console.WriteLine("Notify poroperty found");
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
        } 

        private static void Characteristic_ValueChanged(GattCharacteristic sender, GattValueChangedEventArgs args)
        {
            //string convertedAddress = ConvertMacAddressToString(sender.Service.Device.BluetoothAddress);
            string convertedAddress = ConvertMacAddressToString(sender.Service.Device.BluetoothAddress);
            string dataStr = "";
            //sender.Service.TryDispose();
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
                dataStr += partStr;

                Console.WriteLine("Data " + JsonSerializer.Serialize(partStr) + " From device " + convertedAddress);

                if (partStr.Contains("Ti"))
                {
                    var dataArray = dataStr.Split(',');
                    Console.WriteLine("Data " + JsonSerializer.Serialize(dataStr) +  " From device " + convertedAddress);

                    /* for (int k = 0; k < dataArray.Length; k++)
                     {
                         Console.WriteLine("Key: " + dataArray[k].Split('=')[0] + " Value: " + dataArray[k].Split('=')[1]);
                        *//* string key = dataArray[k].Split('=')[0];
                         string value = dataArray[k].Split('=')[1];
                         dict.Add(key, value);*//*
                     }*/
                    //Console.WriteLine("From device " + sender.Service.Session.DeviceId.Id.ToString());
                    //Console.WriteLine("Data " + + " From device " + ConvertMacAddressToString(sender.Service.Device.BluetoothAddress));
                    //string jsonString = JsonSerializer.Serialize(dict);
                    //Console.WriteLine("Data " + dict +  " From device " + sender.Service.Session.DeviceId.Id.ToString());
                    dataStr = "";
                }
                
                //Console.WriteLine("From device " + sender.Service.Session.DeviceId.Id.ToString());
                //Console.WriteLine("Data " + + " From device " + ConvertMacAddressToString(sender.Service.Device.BluetoothAddress));
            }
            catch (Exception e) {
                Console.WriteLine("Unable to parse " + e.ToString());
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
