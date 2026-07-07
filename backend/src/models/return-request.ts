import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm"

@Entity("return_requests")
export class ReturnRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  order_id: string

  @Column()
  customer_id: string

  @Column({ type: "jsonb" })
  items: {
    line_item_id: string
    quantity: number
    reason: string
  }[]

  @Column({
    type: "enum",
    enum: ["pending", "approved", "picked_up", "refunded", "rejected"],
    default: "pending",
  })
  status: string

  @Column({ type: "jsonb", nullable: true })
  pickup_address: {
    address_1: string
    address_2?: string
    city: string
    state: string
    pincode: string
    phone: string
  }

  @Column({ nullable: true })
  pickup_date: Date

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
