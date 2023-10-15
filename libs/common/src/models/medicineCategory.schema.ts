import { Column, Entity, ManyToMany } from 'typeorm';
import { AbstractEntity } from '../database';
import { User } from './user.schema';

@Entity()
export class MedicineCategory extends AbstractEntity<MedicineCategory> {
  @Column()
  title: string;

  @Column()
  description: string;

  @ManyToMany(() => User, (user) => user.categories)
  users: User[];
}
