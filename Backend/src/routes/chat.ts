import express from "express";
import { Request, Response, NextFunction } from 'express';
import { sequelize } from "../config/database";

const router = express.Router();

export default router