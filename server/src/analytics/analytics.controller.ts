/*The Controller in NestJS acts like a "Traffic Cop."
 It sits at the entrance of your backend, listens for incoming requests
 and directs them to the correct "Handler" (Service) to deal with the logic.*/

import { Controller, Get, UseGuards, Req } from '@nestjs/common';//brings tools needed to build a NestJS controller
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/auth.guard';//security that will check the token we sent from the frontend.

@Controller('analytics')//This tells NestJS that any request starting with /analytics should be handled by this class.
@UseGuards(AuthGuard)//ensures that no one can see the analytics unless they have a valid Firebase token
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get()//This tells NestJS to run the function below if someone makes a GET request (the most common type of request for reading data).c
    //This captures the incoming request object.
    async getAnalytics(@Req() req: any) {
        return this.analyticsService.getAnalytics(req.user.uid);//Calls the service to do the heavy lifting
    }
}
