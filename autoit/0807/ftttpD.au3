$interval = 1000
$lognInterval=5000
$superLongInterval=11000
$windowTitle="FFFTP (*)"

HotKeySet("{ESC}", "Terminate")

Func Terminate()
   MsgBox(0, "Procedure Terminated", "Esc btn pressed and procedure stopped.")
   Exit
EndFunc

Sleep($lognInterval)
WinActivate($windowTitle)
Sleep($interval)
WinActivate("???一?")

Sleep($interval)
Send("192.168.1.91")
Sleep($interval)
Send("!S")
Sleep($interval)
;大寫B無效
Send("^b")
Sleep($interval)
Send("L")
Sleep($interval)
Send("!J")
Sleep($interval)
Send("^b")
Sleep($interval)
Send("H")
Sleep($interval)
Send("!J")

Sleep($interval)
Send("{TAB}")
Sleep($interval)
Send("{DOWN}")
Sleep($interval)
Send("^f") ;大寫無效
Sleep($interval)

;Send($CmdLine[0]) 參數個數
Send($CmdLine[1])

Sleep($interval)
Send("{ENTER}")
Sleep($interval)
Send("{RIGHT}")

Sleep($interval)
Send("^d")

Sleep($superLongInterval)
WinClose("192.168.1.91 (*) - FFFTP")