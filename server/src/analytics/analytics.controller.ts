import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get()
    async getAnalytics(@Req() req: any) {
        return this.analyticsService.getAnalytics(req.user.uid);
    }
}
