const express = require('express');
const multer = require('multer');
const path = require('path');
const { MongoClient } = require('mongodb');
const fs = require('fs/promises');
const { ObjectId } = require('mongodb');
const app = express();
// console.log('HEYYY...this is the File API');

const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'filesoperations';
const client = new MongoClient(uri);

const storage = multer.memoryStorage(); // Use memory storage to store files as buffers

const upload = multer({
    storage,
    fileFilter: (req, file, cb) =>{
        const allowedFileExtensions = ['.jpg','.jpeg','.png','.pdf'];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, allowedFileExtensions.includes(ext));
    }
});

app.set('view engine', 'hbs');
app.set('views', path.resolve('./views'));

app.use(express.urlencoded({ extended: false }));

app.get('/', async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('files');

        const files = await collection.find({},{ projection: { filename: 1, _id: 0 } }).toArray();
        return res.render('home', {files});
    } catch (error) {
        console.error('Error fetching files from MongoDB:', error);
        return res.status(500).send('Internal Server Error');
    } 
    // finally {
    //     await client.close();
    // }
});

app.get('/files', async (req, res) =>{
  try {
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection('files');

      const files = await collection.find({}, { projection:{ filename: 1, _id: 0 } }).toArray();
      return res.status(200).json(files);
  } 
  catch (error){
      console.error('Error fetching files from MongoDB:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
  } 
  finally{
      await client.close();
  }
});

app.post('/upload', upload.single('profileImage'), async (req, res) => {
  console.log("Inside the upload");
    if (req.file) {
        const file = {
            filename: req.file.originalname,
            data: req.file.buffer,
        };

        try {
            await client.connect();
            const db = client.db(dbName);
            const collection = db.collection('files');

            await collection.insertOne(file);
            console.log('File uploaded and saved to MongoDB successfully!');
            return res.status(200).send({ message: 'File Uploaded successfully...' });
        } catch (error) {
            console.error('Error saving file to MongoDB:', error);
            return res.status(500).send('Internal Server Error');
        } 
        // finally {
        //     await client.close();
        // }
    } else {
        console.log("You can't upload this File!");
        return res.status(500).send("You Can't Upload this File Type");
    }
    return res.redirect('/');
});



app.delete('/files/:id', async (req, res) =>{
  const fileId = req.params.id;
  console.log('Deleting file with _id:', fileId);

  // Check if fileId is a valid ObjectId

  // if (!ObjectId.isValid(fileId)) {
  //   console.log('Invalid ObjectId format.');
  //   return res.status(400).send('Invalid ObjectId format.');
  // }
  let client;
  try{
    client = new MongoClient(uri);
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection('files');

    const result = await collection.deleteOne({ _id: new ObjectId(fileId)});
    console.log('checking resulttt',result);

    if (result.deletedCount>0){
      console.log('File deleted successfully!');
      return res.status(200).send({ message: 'File deleted successfully...' });
    }
  //  else{
  //     console.log('File not found.');
  //     return res.status(404).send('File not found.');
  //   }
  } 
  catch (error){
    console.error('An error occurred while deleting the file:', error);
    return res.status(500).send('Internal Server Error');
  }
});

app.listen(8000,() =>{
    console.log('Server is listening on port 8000');
});
