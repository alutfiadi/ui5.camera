sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/Dialog",
    "sap/m/Button",
    "ui5/camera/libs/Download",
    "sap/m/MessageToast",
    "ui5/camera/libs/tesseract.js",
    "sap/m/MessageBox",
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (
    Controller,
    Dialog,
    Button,
    Download,
    MessageToast,
    tesseract,
    MessageBox
  ) {
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
              // that.imageText = oButton.getParent().getContent()[1].getValue();
              that.imageText = oButton
                .getParent()
                .getContent()[0]
                .getContent()[0]
                .getContent()[1]
                .getValue();
              that.cameraDialog.close();
            },
          }),
          content: [
            new sap.ui.layout.VerticalLayout({
              width: "100%",
              class: "gridWrapper",
              content: [
                new sap.ui.layout.Grid({
                  containerQuery: true,
                  vSpacing: 0,
                  defaultSpan: "L12 M12 S12",
                  content: [
                    new sap.ui.core.HTML({
                      content:
                        "<video id='player' width='100%' height='auto' muted autoplay></video>",
                    }),
                    new sap.m.Input({
                      placeholder: "Please input image text here",
                      required: true,
                    }),
                  ],
                }),
              ],
            }),
            // new sap.ui.core.HTML({
            //   content: "<video id='player' autoplay></video>",
            // }),
            // new sap.m.Input({
            //   placeholder: "Please input image text here",
            //   required: true,
            // }),
          ],
          endButton: new Button({
            text: "Cancel",
            press: function () {
              that.cameraDialog.close();
            },
          }),
        });
        this.getView().addDependent(this.cameraDialog);
        this.cameraDialog.open();
        this.cameraDialog.attachBeforeClose(this.setImage, this);
        if (navigator.mediaDevices) {
          navigator.mediaDevices
            .getUserMedia({
              video: true,
            })
            .then(function (stream) {
              player.srcObject = stream;
            });
        }
      },

      setImage: function () {
        var oVBox = this.getView().byId("vBox1");
        var oItems = oVBox.getItems();
        var imageId = "archie-" + oItems.length;
        var fileName = this.imageText;
        var imageValue = this.imageValue;
        if (imageValue == null) {
          MessageToast.show("No image captured");
        } else {
          var oCanvas = new sap.ui.core.HTML({
            content:
              "<canvas id='" +
              imageId +
              "'  " +
              " style='2px solid red'></canvas> ",
          });
          var snapShotCanvas;

          oVBox.addItem(oCanvas);
          var ctx = document.getElementById("canvas");
          ctx.setAttribute("width", imageValue.videoWidth);
          ctx.setAttribute("height", imageValue.videoHeight);
          oCanvas.addEventDelegate({
            onAfterRendering: function () {
              snapShotCanvas = document.getElementById(imageId);
              var oContext = snapShotCanvas.getContext("2d");
              // oContext.drawImage(imageValue,0,0,snapShotCanvas.width,snapShotCanvas.height);
              var imageData = snapShotCanvas.toDataURL("image/png");
              var imageBase64 = imageData.substring(imageData.indexOf(",") + 1);
              console.log(imageBase64);
              // window.open(imageData);  //--Use this if you dont want to use third party download.js file
              // download(imageData, fileName + ".png", "image/png");
            },
          });
        }
      },

      //OCR
      loadTesseract: async function () {
        const worker = await createWorker("eng");
        const ret = await worker.recognize(
          // "https://tesseract.projectnaptha.com/img/eng_bw.png"
          "../assets/pln1.jpeg",
          {
            lang: "eng",
            tessedit_char_whitelist: "0123456789",
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
      },
    });
  }
);
