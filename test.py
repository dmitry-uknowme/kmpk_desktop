import asyncio
import signal


class GracefulExit(SystemExit):
    code = 1


def raise_graceful_exit(*args):
    loop.stop()
    print("Gracefully shutdown")
    raise GracefulExit()


def do_something():
    while True:
        print('da')

loop = asyncio.get_event_loop()
signal.signal(signal.SIGINT, raise_graceful_exit)
signal.signal(signal.SIGTERM, raise_graceful_exit)

# try:
#     loop.run_forever(do_something())
# except GracefulExit:
#     pass
# finally:
#     loop.close()


import asyncio
import signal

from bleak import BleakClient

HEART_RATE_CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb"  # UUID of heart rate characteristic
ADDRESS = "00:15:87:00:B7:E2"
exit_flag = False



def heart_rate_data_handler(sender, data):
    t=+1
    print("Notification: " +str(data))  # Do stuff
    print('Time:',t)


class DisconnectionException(Exception):
    """Raised when the device has disconnected."""


class ShutdownException(Exception):
    """Raised when the program should shutdown."""


def ask_exit():
    global exit_flag
    print("Shutdown Request Received")
    exit_flag = True


async def stay_connected(device_address: str, timeout: float = 4.0):
    global exit_flag
    exit_flag = False
    print("Starting Loop")
    client = BleakClient(address_or_ble_device=device_address, timeout=timeout)
    global t
    t = 0
    try:
        print("Connecting to device.")
       
        await client.connect()
        await notify_and_record(client)
    except DisconnectionException as e:
        print(e)
    except ShutdownException as e:
        print(e)
    except Exception as e:
        print(e)
        pass

    print("Shutting down notification.")
    await client.stop_notify(HEART_RATE_CHARACTERISTIC_UUID)
    print("Done shutting down notification.")

    print("Disconnecting to device.")
    await client.disconnect()
    print("End of Loop Iteration")


async def notify_and_record(client):
    global exit_flag

    def disconnect_callback(client, future):
        raise DisconnectionException("Client with address {} got disconnected!".format(client.address))

    client.set_disconnected_callback(disconnect_callback)

    print("Connected: {0}".format(await client.is_connected()))
    print("Starting notification.")
    await client.start_notify(HEART_RATE_CHARACTERISTIC_UUID, heart_rate_data_handler)
    while not exit_flag:
        await asyncio.sleep(1)

    print("Shutting Down.")
    # await client.stop_notify(HEART_RATE_CHARACTERISTIC_UUID)
    # await client.disconnect()
    raise ShutdownException


async def run():

    print("Attempting to connect to device and start recording.")
    await stay_connected(device_address=ADDRESS)


def main():

    loop = asyncio.get_event_loop()

    # for sig in (signal.SIGINT, signal.SIGTERM):
    #     loop.add_signal_handler(sig, ask_exit)
    try:
        loop.run_until_complete(run())
    except GracefulExit:
        print('grace exception')
        ask_exit()
    finally:
        print('grace close')
        loop.close()
    # I had to manually remove the handlers to
    # avoid an exception on BaseEventLoop.__del__
    # for sig in (signal.SIGINT, signal.SIGTERM):
    #     loop.remove_signal_handler(sig)

    loop.stop()
    loop.close()
    print("Done.")


if __name__ == "__main__":
    main()