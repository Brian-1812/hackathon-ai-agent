import { Column, Entity, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../database';
import { User } from './user.schema';

@Entity()
export class Query extends AbstractEntity<Query> {
  @Column()
  question: string;

  @Column()
  response: string;

  @Column()
  tags?: string;

  // @ManyToOne(() => User, (user) => user.queries)
  // user: User;
}
