osascript<<EOF
		tell application "System Events"
		tell process "Terminal" to keystroke "n" using command down
		end 
		tell application "Terminal"
		activate
		do script with command "cd `pwd`" in window 1
		do script with command "cd ../..
" in window 1
		do script with command "clear" in window 1
		do script with command "nix-shell https://holochain.love" in window 1
		do script with command "cd /Users/cristian/holochain/coreconcepts/cc_tuts" in window 1
		do script with command "hc package
" in window 1
		end tell
		EOF