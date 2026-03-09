import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';

describe('AppModule Integration', () => {
    let module: TestingModule;

    beforeAll(async () => {
        // We initialize the TestingModule checking if the root AppModule and its controllers can be instantiated properly
        module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });
});
