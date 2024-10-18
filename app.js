async function SelectionFile() {
  return new Promise((resolve, error) => {
    try {
      const elementFile = document.createElement("input")
      elementFile.type = "file"
      elementFile.name = "file"
      elementFile.addEventListener("change", () => {
        const readerFile = new FileReader()
        readerFile.onload = function(e) {
          resolve({
            name: elementFile.files[0].name,
            buffer: readerFile.result
          })
        }
        readerFile.onerror = (e) => {
          error(e)
        }
        readerFile.readAsArrayBuffer(elementFile.files[0])
      })
      elementFile.click()
    } catch(err) {
      error(err)
    }
  })
}
async function requestPrinter() {
  try {
    const device = await navigator.usb.requestDevice({ filters: [{ classCode: 0x07 }] })
    await device.open()
    await device.selectConfiguration(1)
    console.log(device.configuration.interfaces)
    let listDs = []
    for(let a of device.configuration.interfaces) {
      console.log("In:", a.interfaceNumber, a)
      for(let b of a.alternates) {
        console.log('Alter:', b)
        for(let c of b.endpoints) {
          if(c.direction == "out") {
            listDs.push({
              interface: a.interfaceNumber,
              endpoint: c.endpointNumber
            })
          }
          console.log("End In:", c.endpointNumber)
          console.log("End Dir:", c.direction)
        }
      }
    }

    device.claimInterface(listDs[0].interface)
    console.log(listDs)
    console.log("Printer connected: " + device.productName)
    return device
  } catch (error) {
    console.error("Error accessing printer: ", error)
  }
}

function F() {
  try {
    let deviceUsb, fileBuffer;

    const fileSelect = document.querySelector('button[data-input-type="file"]')
    const deviceSelect = document.querySelector('button[data-input-type="usb"]')
    const triggerAPI = document.querySelector('button[data-input-type="action"]')

    fileSelect.addEventListener("click", async () => {
      const getfile = await SelectionFile()
      const listfile = "docx,doc,docs,xlsx,xls,pdf".split(",")
      if(!listfile.includes(getfile.name.split(".").pop())) {
        return alert(`Only support file like ${listfile.join(", ")}`)
      }
      fileBuffer = getfile.buffer
      if(fileBuffer && deviceUsb) {
        triggerAPI.disabled = false
      }
    })
    deviceSelect.addEventListener("click", async () => {
      const getusb = await requestPrinter()
      deviceUsb = getusb
      if(fileBuffer && deviceUsb) {
        triggerAPI.disabled = false
      }
    })
    triggerAPI.addEventListener("click", async () => {
      if(deviceUsb && fileBuffer) {
        await deviceUsb.transferOut(listDs[0].endpoint, fileBuffer)
        alert("Printer start progress")
      } else {
        alert("Please select file and select usb to start this executed!")
      }
    })
  } catch(err) {
    console.error(err.stack)
  }
}
F()