import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    JoinColumn,
    JoinTable
} from "typeorm";

import { Pokemon } from "./pokedex";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: number;

    @Column("varchar", { length: 11, unique: true, comment: "用户名" })
    username: string;

    @Column("varchar", { length: 17, comment: "密码" })
    password: string;

    @Column("varchar", { length: 20, comment: "职业", default: "未知" })
    profession: string;

    @Column("varchar", { length: 100, default: "", comment: "头像"})
    avatar: string;

    @Column("varchar", { length: 100, default: "", comment: "个性签名"})
    quotes: string;

    @ManyToMany(type => Pokemon, pokemon => pokemon.users)
    @JoinTable({
        name: "user_pokemon_favorite",
        joinColumn: {
            name: "user_id",
            referencedColumnName: "id"
        },
        inverseJoinColumn: {
            name: "pokemon_id",
            referencedColumnName: "id"
        }
    })
    favoritePokemons: Pokemon[];

    verify() {
        console.log(1);
    }
}