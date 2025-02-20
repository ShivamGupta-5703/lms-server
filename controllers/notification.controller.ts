import {Response, Request, NextFunction} from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import ErrorHandler from '../utils/ErrorHandler';
import NotificationModel from '../models/notification.model';
import cron from 'node-cron';

// get all notifications - only admin
export const getNotifications = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try{
        const notificatiions = await NotificationModel.find().sort({createdAt: -1});
        res.status(200).json({
            success : true,
            notificatiions,
        })

    }catch(err : any){
        return next(new ErrorHandler(err.message, 500));
    }
})


// update notification status - only admin
export const updateNotification = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try{
        const notification = await NotificationModel.findById(req.params.id);
        if(!notification){
            return next(new ErrorHandler("Notification not found", 404));
        }else{
            notification.status ? notification.status = 'read' : notification.status ;
        }

        await notification.save();
        const notifications = await NotificationModel.find().sort({
            createdAt : -1,
        });
        res.status(200).json({
            success : true,
            notifications,
        })


    }catch(err : any){
        return next(new ErrorHandler(err.message, 500));
    }
})


// delete notification - only admin
// call every midnight, to check if notifications are older than 30 days delete them
cron.schedule('0 0 0 * * *', async() => { 
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    NotificationModel.deleteMany({status : 'read', createdAt : {$lt : thirtyDaysAgo}});  
    console.log("Read notifications deleted successfully");
})