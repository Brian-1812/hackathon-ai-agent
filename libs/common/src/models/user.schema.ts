import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { AbstractEntity } from '../database';
import { Query } from './query.schema';
import { MedicineCategory } from './medicineCategory.schema';

export enum UserRole {
  ADMIN = 'ADMIN',
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
}

@Entity()
export class User extends AbstractEntity<User> {
  @Column()
  phoneNumber: string;

  @Column()
  password: string;

  @Column()
  email: string;

  @Column()
  fName: string;

  @Column()
  lName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PATIENT })
  role: UserRole;

  @ManyToMany(() => MedicineCategory, (category) => category.users, {
    eager: true,
  })
  @JoinTable({ name: 'UserCategory' })
  categories: MedicineCategory[];

  @OneToMany(() => Query, (query) => query.user)
  queries: Query[];
}
