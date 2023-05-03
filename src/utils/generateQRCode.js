const qrcode = require("qrcode");
const { responseFormat } = require("./responseFormat");
exports.generateQRCode = (data,res) => {
  const qrCodeData = JSON.stringify(data);
  const qrCodeOptions = {
    errorCorrectionLevel: "H",
    type: "image/jpeg",
    quality: 0.3,
  };
  const qrCodeFileName = `${data.id}.jpg`;
  qrcode.toFile(`./bookingQRCodes/${qrCodeFileName}`, qrCodeData, qrCodeOptions, (err) => {
    if (err) {
      res.status(500).json(responseFormat(false, "Internal QR Code Generate Error", {}));
    }
  });
};