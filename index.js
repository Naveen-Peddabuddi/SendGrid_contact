const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(express.json());
const client = require('./client')
const sendgrid = require('@sendgrid/client');
sendgrid.setApiKey(client.sendgrid.setApiKey);

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
const port = process.env.PORT

const isEmailAvailable = async (emails) => {
    try{
        const data = {
            "emails": [
                ...emails
            ]
        }
        const requestPayload = {
            url: `/v3/marketing/contacts/search/emails`,
            method: 'POST',
            body: data
          }
          

        const mails = await sendgrid.request(requestPayload)
        emails = emails.filter((email) => {
            return (mails[1]?.result?.[email]?.error && !mails[1]?.result?.[email]?.contact);
        });
        if(!emails.length){
            return true;
        }
        return false;
    }
    catch(err){
        return false;
    }
}
const createEmailPayload = (emails) => {
    let payload = {
        "contacts": emails.map(email => {
            return {
                "email": email
            }
        }
        )
    }
    return payload;
}
const insertEmail = async (emails) => {
    try{
        
          const data = createEmailPayload(emails);
          const request = {
            url: `/v3/marketing/contacts`,
            method: 'PUT',
            body: data
          }
          
         let [response, body] = await sendgrid.request(request)
            console.log(response.statusCode)
            console.log(body)
    }
    catch(err){
        console.log(err);
    }
}

const validateEmail = (email) => {
    return emailRegex.test(email);
}
app.post('/contact', async(req, res) => {
    try{
        if(!req.body?.email?.length){
            return res.status(400).send({message: 'Email is required'});
        }
        const emails = req.body.email;
        for(let email of emails){
            if(!validateEmail(email)){
                console.error('Email is invalid');
                return res.status(400).send({message: 'Email is invalid'});
            }
        }
        const isAvailable = await isEmailAvailable(emails);
        if(isAvailable){
            console.error('Some or all the emails are already registered');
            return res.status(400).send({message: 'Some or all the emails are already registered'});
        }
        await insertEmail(emails);
        return res.status(200).send({message: 'Emails are registered successfully'});
    }
    catch(err){
        console.log(err);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})
