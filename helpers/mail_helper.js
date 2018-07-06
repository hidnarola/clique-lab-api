var nodemailer = require('nodemailer');
var EmailTemplate = require('email-templates').EmailTemplate;

var config = require("./../config");
var mail_helper = {};

var transporter = nodemailer.createTransport({
    // service: 'gmail',
    host: 'cliquelabs.com',
    port: 465,
    // secure: false, // upgrade later with STARTTLS
    auth: {
        user: config.SMTP_MAIL,
        pass: config.SMTP_PASSWORD
    },
    // tls: { ciphers: 'SSLv3' },
    tls:{rejectUnauthorized:false},
    from: "Clique Labs <noreply@cliquelabs.com>"
});

mail_helper.send = async(template_name, options, data) => {
    var template_sender = transporter.templateSender( new EmailTemplate('emails/'+template_name), {
        from: "Clique Labs <noreply@cliquelabs.com>"
    });

    return template_sender({
        to : options.to,
        subject: options.subject,
    },data).then(function(info){
        return {"status":1,"message":info};
    }).catch(function(err){
        return {"status":0,"error":err};
    });
};

module.exports = mail_helper;