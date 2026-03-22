import { Test, TestingModule } from '@nestjs/testing';
import { HospitalsService } from './hospitals.service';
import { FirebaseService } from '../firebase/firebase.service';

describe('HospitalsService', () => {
  let service: HospitalsService;
  let firebaseService: FirebaseService;

  const mockSnapshot = {
    exists: jest.fn(() => true),
    val: jest.fn(() => ({
      hospitalName: 'General Hospital',
      resources: [{ type: 'Bed', available: 5 }],
      lastUpdated: 1711123456789,
    })),
  };

  const mockRef = {
    get: jest.fn(() => Promise.resolve(mockSnapshot)),
  };

  const mockFirebaseService = {
    ref: jest.fn(() => mockRef),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HospitalsService,
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();

    service = module.get<HospitalsService>(HospitalsService);
    firebaseService = module.get<FirebaseService>(FirebaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return availability for a registered hospital', async () => {
    const result = await service.getHospitalAvailability('place123');
    expect(result.registered).toBe(true);
    expect(result.name).toBe('General Hospital');
    expect(result.resources).toHaveLength(1);
    expect(firebaseService.ref).toHaveBeenCalledWith('hospitals/place123');
  });

  it('should return not registered for non-existent hospital', async () => {
    mockSnapshot.exists.mockReturnValueOnce(false);
    const result = await service.getHospitalAvailability('place456');
    expect(result.registered).toBe(false);
    expect(result.message).toContain('not registered');
  });
});
