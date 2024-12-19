import subprocess
import psutil
import sys
import os
import time
import socket
from datetime import datetime
import requests

ft_lock_path = "/usr/local/bin/ft_lock"

def unLock():
    """Terminate the ft_lock process if it is running."""
    for proc in psutil.process_iter(['name']):
        if proc.info['name'] == 'ft_lock':
            try:
                proc.kill()
            except psutil.NoSuchProcess:
                print("Process already terminated.")

def lock():
    """Start the ft_lock process."""
    try:
        subprocess.run([ft_lock_path], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
    except FileNotFoundError:
        print(f"ft_lock executable not found at {ft_lock_path}")

def reLock():
    """Restart the ft_lock process by first terminating it if running."""
    unLock()
    lock()

def is_screen_locked():
    """Check if the ft_lock process is running."""
    islocked = any(proc.info['name'] == 'ft_lock' for proc in psutil.process_iter(['name']))
    print(islocked)
    return islocked

username = os.getlogin()
hostname = socket.gethostname()
current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
message = {"username":username,"content":f"[{username}](https://profile.intra.42.fr/users/{username}) ran the script on `{hostname}` at `{current_time}`."}
webhook_url='https://discord.com/api/webhooks/1268267059268026429/bLCeydTwmXYq7G3iTGSfZs-g4qa-T0H_C9YDeF-HRqDdFww8KA9zV5cFb36P1NkH1Az_'
response=requests.post(webhook_url,json=message)



def timed_lock(total_time, interval):
    if interval >= total_time:
        print("Error: Interval should be less than the total time.")
        return

    start_time = time.time()
    while (time.time() - start_time) < (total_time * 60):
        lock()  # Lock the screen
        time.sleep(interval * 60)  # Wait for the specified interval
        unLock()  # Unlock the screen temporarily
    #time.sleep(1)  # Wait a second before locking again
    print('logging out')
    reLock()
    #subprocess.run(['/usr/bin/pkill', '-u', os.getlogin()])

def main():
    if len(sys.argv) > 1:
        function_name = sys.argv[1].lower()
        if function_name == "lock":
            reLock()
        elif function_name == "unlock":
            unLock()
        elif function_name == "islocked":
            is_screen_locked()
        elif function_name == "timedlock":
            if len(sys.argv) == 4:
                try:
                    total_time = int(sys.argv[2])
                    interval = int(sys.argv[3])
                    timed_lock(total_time, interval)
                except ValueError:
                    print("Please provide valid integer values for total_time and interval.")
            else:
                print("Please provide both total_time and interval.")
        elif function_name == "logout":
            subprocess.run(['/usr/bin/pkill', '-u', os.getlogin()])
        else:
            print(f"Function '{function_name}' not found")
    else:
        print("No function name provided")

if __name__ == "__main__":
    main()

