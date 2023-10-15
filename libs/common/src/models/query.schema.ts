import { Column, Entity, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../database';
import { User } from './user.schema';

@Entity()
export class Query extends AbstractEntity<Query> {
  @Column({ type: 'longtext' })
  question: string;

  @Column({ type: 'longtext' })
  response: string;

  @Column({ type: 'longtext' })
  tags?: string;

  @ManyToOne(() => User, (user) => user.queries)
  user: User;
}
