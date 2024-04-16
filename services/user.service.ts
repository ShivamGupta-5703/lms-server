import {Response} from "express";
import UserModel from "../models/user.model";
import { redis } from "../utils/redis";



//get user by id
export const getUserById = async (id: string, res: Response) => {
    const userJson = await redis.get(id);
    
    if(userJson){
        const user = JSON.parse(userJson);
        res.status(201).json({
            success: true,
            user,
        })
    };
}


// get all users
export const getAllUsersService = async (res: Response) => {
    const users = await UserModel.find().sort({createdAt : -1});
    res.status(201).json({
        success: true,
        users,
    });
}


// update user role
export const updateUserRoleService = async (id: string, role: string, res: Response) => {
    const user = await UserModel.findByIdAndUpdate(id, {role}, {new: true});
    res.status(201).json({
        success: true,
        user,
    });
}