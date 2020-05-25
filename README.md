# ChatPlaceBot

## CHATPLACEBOT IS OFFICIALLY DISCONTINUED.

## Miscellaneous Command Syntax

These are commands that are only in here for fun or small tasks that don't need seperate programming

### PRESET 1: THE STRUCTURE OF A COMMAND
```
"example":["You just did /example!"]
```
This command will react to /example with "You just did /example"

### PRESET 2: SPECIAL COMMAND THINGS
```
"tellmemyname":["Your name is: %(SENDER)"]
```
This command will react to /tellmemyname with the sender's name

### PRESET 3: ARG1
```
"echothefirstword":["%(ARG1)"]
```
This command will react to "/echothefirstword Yeet The Baby" with "Yeet"

### PRESET 4: ALLARGS
```
"echo":["%(ALLARGS)"]
```
This command will react to "/echo Yeet The Baby" with "Yeet The Baby"

### PRESET 5: ALLARGSAFTER1
```
"tell":["Hey %(ARG1), you've been told: %(ALLARGSAFTER1)]"
```
This command will react to "/tell John Hello you stoopid" with "Hey John, you've been told: Hello you stoopid"

### PRESET 6: RANDOMIZATION
```
"dice": ["1!","2!","3!","4!","5!","6!"]
```
This command will randomly react to "/dice" with "1!", "2!", "3!", "4!", "5!", or "6!".

### END PRODUCT
```
[
  "example":["You just did /example!"],
  "tellmemyname":["Your name is: %(SENDER)"],
  "echothefirstword":["%(ARG1)"],
  "echo":["%(ALLARGS)"],
  "tell":["Hey %(ARG1), you've been told: %(ALLARGSAFTER1)]",
  "dice": ["1!","2!","3!","4!","5!","6!"]
]
```

Make sure to put a comma after each command!
