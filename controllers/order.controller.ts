import {Response, Request, NextFunction} from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import ErrorHandler from '../utils/ErrorHandler';
import OrderModel, {IOrder} from '../models/order.model';
import userModel from '../models/user.model';
import CourseModel from '../models/course.model';
import path from 'path';
import ejs from 'ejs';
import sendMail from '../utils/sendMail';
import NotificationModel from '../models/notification.model';
import { getAllOrdersService, newOrder } from '../services/order.service';


//create Order
export const createOrder = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try{
        const {courseId, payment_info} =  req.body as IOrder;

        const user = await userModel.findById(req.user?._id);
        const courseExistInUser = user?.courses.some((course: any) => course._id.toString() === courseId);
        if(courseExistInUser){
            return next(new ErrorHandler("You have already purchased this course", 400));
        }

        const course = await CourseModel.findById(courseId);
        if(!course){
            return next(new ErrorHandler("Course not found", 404));
        }

        const data : any = {
            courseId : course._id,
            userId : user?._id,
            payment_info,
        }

        const mailData = {
            order : {
                _id : course._id.toString().slice(0, 6),
                name : course.name,
                price : course.price,
                date : new Date().toLocaleDateString('en-US',{year : 'numeric', month : 'long', day : 'numeric'}),
            }
        }

        const html = await ejs.renderFile(path.join(__dirname, '../mails/order-confirmation.ejs'), {order : mailData});
        try{
            if(user){
                await sendMail({
                    email : user.email,
                    subject : "Order Confirmation",
                    template : "order-confirmation.ejs",
                    data : mailData,
                })
            }

        }catch(err : any){
            return next(new ErrorHandler(err.message, 500));
        }
        
        // add course to user course array
        user?.courses.push(course?._id);
        await user?.save();

        // notify admin
        await NotificationModel.create({
            userId : user?._id,
            title : "New Order",
            message : `${user?.name} has purchased ${course?.name}`,
        });

        course.purchased ? course.purchased += 1 : course.purchased;
        await course?.save();

        newOrder(data, res, next);


    }catch(err : any){
        return next(new ErrorHandler(err.message, 500));
    }
})


// get all orders  -- only for admin
export const getAllOrders = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try{
        getAllOrdersService(res);
    }catch(err : any){
        return next(new ErrorHandler(err.message, 400));
    }
})