import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm"

@Entity("reviews")
export class Review {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  product_id: string

  @Column()
  customer_id: string

  @Column({ type: "int" })
  rating: number

  @Column({ length: 200, nullable: true })
  title: string

  @Column({ type: "text", nullable: true })
  body: string

  @Column("simple-array", { nullable: true })
  images: string[]

  @Column({ default: false })
  is_verified: boolean

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
