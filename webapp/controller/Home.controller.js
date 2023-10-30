sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "ui5/camera/libs/Download",
    "ui5/camera/libs/tesseract.js",
    "ui5/camera/libs/preprocess"
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, Dialog, Button, MessageToast, MessageBox, Download, tesseract, preprocess) {
    "use strict";
    const createWorker = tesseract["createWorker"];
    return Controller.extend("ui5.camera.controller.Home", {
      onInit: function () {},

      //PHOTO
      capturePic: function () {
        var that = this;
        this.cameraDialog = new Dialog({
          title: "Click on Capture to take a photo",
          // contentWidth: "100%",
          // contentHeight: "100%",
          horizontalScrolling: false,
          // stretchOnPhone: true,
          beginButton: new Button({
            text: "Capture",
            press: function (oEvent) {
              that.imageValue = document.getElementById("player");
              var oButton = oEvent.getSource();
              that.imageText = oButton.getParent().getContent()[1].getValue();
              // that.imageText = oButton.getParent().getContent()[0].getContent()[0].getContent()[1].getValue();
              that.cameraDialog.close();
              that.cameraDialog.destroy();
            }
          }),
          content: [
            new sap.ui.core.HTML({
              content:
                "<video id='player' style='-webkit-transform: scaleX(1);transform: scaleX(1);width: 100%;height: auto;' autoplay muted playsinline></video>"
              // "<video id='player' width='100%' height='auto' muted autoplay></video>",
            }),
            new sap.m.Input({
              placeholder: "Please input image text here",
              required: true
            })
          ],
          endButton: new Button({
            text: "Cancel",
            press: function () {
              that.stopCamera(that.stream);
              that.cameraDialog.close();
              that.cameraDialog.destroy();
            }
          })
        });

        this.getView().addDependent(this.cameraDialog);
        this.cameraDialog.open();
        this.cameraDialog.attachBeforeClose(this.setImage, this);

        if (navigator.mediaDevices) {
          navigator.mediaDevices
            .getUserMedia({
              audio: false,
              video: {
                facingMode: "environtment",
                height: { ideal: 1920 },
                width: { ideal: 1920 }
              }
            })
            .then(function (stream) {
              player.srcObject = stream;
              that.vheight = stream.getVideoTracks()[0].getSettings().height;
              that.vwidth = stream.getVideoTracks()[0].getSettings().width;
              that.stream = stream;
            });
        }
      },

      setImage: function () {
        var oVBox = this.getView().byId("vBox1");
        var oItems = oVBox.getItems();
        var imageId = "canvas1";
        var fileName = this.imageText;
        var imageValue = this.imageValue;
        var imageheight = this.vheight;
        var imagewidth = this.vwidth;
        var that = this;
        if (imageValue == null) {
          MessageToast.show("No image captured");
        } else {
          var oCanvas = new sap.ui.core.HTML({
            content: "<canvas id='" + imageId + "'  " + " style='2px solid red'></canvas> "
          });
          var snapShotCanvas;

          oVBox.addItem(oCanvas);
          // var ctx = document.getElementById("canvas");
          // ctx.setAttribute("width", imageValue.videoWidth);
          // ctx.setAttribute("height", imageValue.videoHeight);
          oCanvas.addEventDelegate({
            onAfterRendering: function () {
              // set size proportional to image
              var canvas = document.getElementById(imageId);
              var ctx = canvas.getContext("2d");
              canvas.height = canvas.width * (imageheight / imagewidth);
              // step 1 - resize to 50%
              // var oc = document.createElement("canvas"),
              //   octx = oc.getContext("2d");

              // oc.width = imageheight * 0.5;
              // oc.height = imagewidth * 0.5;
              // octx.drawImage(imageValue, 0, 0, oc.width, oc.height);

              // // step 2
              // octx.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5);

              // step 3, resize to final size
              // ctx.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5, 0, 0, canvas.width, canvas.height);
              ctx.drawImage(imageValue, 0, 0, imagewidth, imageheight, 0, 0, canvas.width, canvas.height);
              ctx.putImageData(preprocessImage(canvas), 0, 0);

              // snapShotCanvas = document.getElementById(imageId);
              // var oContext = snapShotCanvas.getContext("2d");
              // oContext.drawImage(imageValue, 0, 0);
              var imageData = canvas.toDataURL("image/png");
              var imageBase64 = imageData.substring(imageData.indexOf(",") + 1);
              // console.log(imageBase64);
              // window.open(imageData);  //--Use this if you dont want to use third party download.js file
              // download(imageData, fileName + ".png", "image/png");
              that.stopCamera(that.stream);
              that.loadTesseract(imageData).then((result) => {
                MessageBox.show(result);
              });
            }
          });
        }
      },

      stopCamera: function (stream) {
        stream.getTracks().forEach(function (track) {
          track.stop();
        });
      },

      reTakePhoto: function () {
        var canvas = document.getElementById(imageId);
        canvas.destroy();
      },

      //OCR
      loadTesseract: async function (imgdata) {
        const worker = await createWorker("eng");
        const ret = await worker.recognize(
          // "https://tesseract.projectnaptha.com/img/eng_bw.png"
          // "../assets/pln1.jpeg",
          imgdata,
          {
            // oem: 1,
            // psm: 3
            lang: "eng"
            // tessedit_char_whitelist: "0123456789"
          }
        );
        console.log(ret.data.text);
        await worker.terminate();
        return ret.data.text;
      },
      onTess: function () {
        this.loadTesseract().then((result) => {
          MessageBox.show(result);
        });
      }
    });
  }
);
