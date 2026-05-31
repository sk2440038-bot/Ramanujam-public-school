const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ DB Error:', err));

const admissionSchema = new mongoose.Schema({
  studentName: String, dob: String, gender: String,
  classApplied: String, fatherName: String, motherName: String,
  phone: String, email: String, address: String,
  submittedAt: { type: Date, default: Date.now }
});

const Admission = mongoose.model('Admission', admissionSchema);

app.post('/api/admission', async (req, res) => {
  try {
    const data = new Admission(req.body);
    await data.save();
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS }
    });
    await transporter.sendMail({
      from: process.env.EMAIL, to: req.body.email,
      subject: '✅ Admission Received - Ramnujam Public School',
      html: `<h2>Dear ${req.body.studentName},</h2><p>Your admission form has been received for Class ${req.body.classApplied}.</p><p>Regards,<br/>Ramnujam Public School</p>`
    });
    res.status(200).json({ success: true, message: 'Form submitted!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
  }
});

app.get('/api/admissions', async (req, res) => {
  const admissions = await Admission.find().sort({ submittedAt: -1 });
  res.json(admissions);
});

app.listen(3000, () => console.log('🚀 Server running on port 3000'));