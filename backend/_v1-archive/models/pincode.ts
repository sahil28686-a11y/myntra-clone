import { Entity, PrimaryColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity("pincodes")
export class Pincode {
  @PrimaryColumn({ length: 6 })
  pincode: string

  @Column({ default: true })
  is_serviceable: boolean

  @Column({ type: "int", default: 3 })
  estimated_days: number

  @Column({ nullable: true })
  city: string

  @Column({ nullable: true })
  state: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
