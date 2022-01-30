import mongoose from 'mongoose';
import { app } from './app';

const PORT = process.env.PORT || 9000;
const MONGO_URI = process.env.MONGO_URI;

const start = async () => {
    if (!MONGO_URI) {
        throw new Error('MONGO_URI must be defined');
    }
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB.....!!!!!');
    } catch (err) {
        console.error(err);
    }
    app.listen(PORT, () => {
        console.log(`Auth service listening on PORT: ${PORT}`);
    });
};

start();