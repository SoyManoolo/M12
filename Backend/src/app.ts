import express from "express";
import cors from 'cors';
import { errors } from "celebrate";

export const app = express();
app.use(express.json());
app.use(cors());

app.use(errors());