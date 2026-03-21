export class CreateUserDto {
    name: string;
    email: string;
    hospitalName?: string;
    hospitalPlaceId?: string;
    password?: string; // We require password for manual user creation so they can sign in initially
    role: 'superadmin' | 'admin' | 'fleet_officer';
}
