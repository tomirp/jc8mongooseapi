const express  = require('express')
const port = require('./config')
const cors = require('cors')
const multer = require('multer')
const sharp = require('sharp')
const User = require('./models/user')
const Task = require('./models/task')
require('./config/mongose')


const app = express()
app.use(cors())
app.use(express.json())

app.post('/users', async (req, res) => { // Register user
    const user = new User(req.body) // create user

    try {
        await user.save() // save user
        res.status(201).send(user)
    } catch (e) {
        res.status(404).send(e.message)
    }
})

app.post('/users/login', async (req, res) => {// Login user
    const {email, password} = req.body // destruct property

    try {
        const user = await User.findByCredentials(email, password) // Function buatan sendiri, di folder models file user.js
        res.status(200).send(user)
    } catch (e) {
        res.status(201).send(e)
    }
})

app.post('/tasks/:userid', async (req, res) => { // Create tasks by user id
    try {
        const user = await User.findById(req.params.userid) // search user by id
        if(!user){ // jika user tidak ditemukan
            throw new Error("Unable to create task")
        }
        const task = new Task({...req.body, owner: user._id}) // membuat task dengan menyisipkan user id di kolom owner
        user.tasks = user.tasks.concat(task._id) // tambahkan id dari task yang dibuat ke dalam field 'tasks' user yg membuat task
        await task.save() // save task
        await user.save() // save user
        res.status(201).send(task)
    } catch (e) {
        res.status(404).send(e)
    }
})

app.get('/tasks/:userid', async (req, res) => { // Get own tasks
    try {
        // find mengirim dalam bentuk array
       const user = await User.find({_id: req.params.userid})
                    .populate({path:'tasks'}).exec()
        res.send(user[0].tasks)
    } catch (e) {
        
    }
})

app.delete('/tasks', async (req, res) => { // Delete task
    try {
        const task = await Task.findOneAndDelete({_id: req.body.id})

        if(!task){
            return res.status(404).send("Delete failed")
        }

        res.status(200).send(task)
    } catch (e) {
        res.status(500).send(e)
    }
})

app.patch('/tasks/:taskid/:userid', async (req, res) => { // Edit Task
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if(!isValidOperation) {
        return res.status(400).send({err: "Invalid request!"})
    }

    try {
        const task = await Task.findOne({_id: req.params.taskid, owner: req.params.userid})
        
        if(!task){
            return res.status(404).send("Update Request")
        }
        
        updates.forEach(update => task[update] = req.body[update])
        await task.save()
        
        res.send("update berhasil")
        
        
    } catch (e) {
        
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000 // Byte max size
    },
    fileFilter(req, file, cb){                                 
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            // throw error
            return cb(new Error('Please upload image file (jpg, jpeg, png)'))
        }

        // diterima
        cb(undefined, true)
    }
})

app.post('/users/:userid/avatar', upload.single('avatar'), async (req, res) => { // POST IMAGE
    try {
        const buffer = await sharp(req.file.buffer).resize({ width: 250 }).png().toBuffer()
        const user = await User.findById(req.params.userid)
        
        if(!user) {
            throw new Error("Unable to upload")
        }

        user.avatar = buffer
        await user.save()
        res.send("Upload Success !")
    } catch (e) {
        res.send(e)
    }
})

app.get('/users/:userid/avatar', async (req, res) => { // GET IMAGE, source gambar
    try {
        const user = await User.findById(req.params.userid)

        if(!user || !user.avatar){
            throw new Error("Not found")
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.send(e)
    }
})

app.get('/users/me/:userid', async (req, res) => { // READ PROFILE, untuk Profile.js
    try {
       const user = await User.findById(req.params.userid)
       res.send({
            photo: `http://localhost:2009/users/${user._id}/avatar`,
            user: user
       })
    } catch (e) {
        res.send(e)
    }
})

app.post('/editprofile/:userid', upload.single('avatar'),async (req, res) => { // Update Profile
    var arrBody = Object.keys(req.body) // ['nama', 'email', 'age']

    arrBody.forEach(key => {  // menghapus field yang tidak memiliki data
        if(!req.body[key]) {
            delete req.body[key]
        }       
    })

    const updates = Object.keys(req.body)  // array baru setelah filtering (delete)  
    const allowedUpdates = ['name', 'email', 'password', 'age', 'avatar'] // field yang boleh di update
    const isValidOperation = updates.every(update => allowedUpdates.includes(update)) // Check field yg di input user

    if(!isValidOperation) { // jika invalid
        throw new Error("Invalid Request")
    }

    try {
       const user = await User.findById(req.params.userid) // Cari user
       updates.forEach(update => user[update] = req.body[update]) // Update data user (text)

       if(req.file){ // Jika tersedia gambar, maka akan update gambarnya
        const buffer = await sharp(req.file.buffer).resize({ width: 250}).png().toBuffer() 
        user.avatar = buffer
       }

       user.save() // Save perubahan data pada user
       res.send(user) //  Kirim data user yang sudah di update
    } catch (e) {
        res.send(e)
    }


})
























app.listen(port, () => console.log("API Running on port " + port))