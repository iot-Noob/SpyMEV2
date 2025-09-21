from models.validate_ep import Update_RTC

data={
    "ice":["candidate:842163049 1 udp 1677729535 192.168.1.10 54321 typ srflx raddr 0.0.0.0 rport 0 generation 0 ufrag dummyUfrag network-id 3"]
     
}
if __name__=="__main__":
    try:
        Update_RTC(**data)
    except Exception as e:
        print(f"Error validate due to::: {e}")