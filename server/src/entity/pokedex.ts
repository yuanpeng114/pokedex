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

import { User } from "./user";

@Entity()
export class Generation {

    @PrimaryGeneratedColumn()
    id?: number;

    @Column("varchar", { length: 5, unique: true, comment: "世代" })
    gen: string;

    @OneToMany(type => Pokemon, pokemon => pokemon.generation)
    pokemons: Pokemon[];

    @OneToMany(type => Move, move => move.generation)
    moves: Move[];
}

@Entity()
export class Type {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("varchar", { name: "type_name", length: 3, unique: true, comment: "属性" })
    typeName: string;

    @OneToMany(type => Move, move => move.generation)
    moves: Move[];

    @ManyToMany(type => Pokemon, pokemon => pokemon.types)
    pokemons: Pokemon[];
}

@Entity()
export class Move {

    @PrimaryGeneratedColumn()
    id?: number;

    @Column("varchar", { name: "move_name", length: 10, unique: true, comment: "招式名" })
    moveName: string;

    @Column("varchar", { name: "battle_description", length: 500, comment: "对战效果说明" })
    battleDescription: string;

    @Column("varchar", { length: 100, default: "", comment: "招式说明" })
    description: string;

    @Column("varchar", { length: 3, default: 0,  comment: "威力" })
    power: string;

    @Column("varchar", { length: 3, default: 0,  comment: "命中率" })
    hit: string;

    @Column("varchar", { length: 3, comment: "技能点数" })
    pp: string;

    @Column("varchar", { name: "max_pp", length: 3, comment: "最大技能点数" })
    maxPP: string;

    @Column("varchar", { length: 5, comment: "招式类别" })
    category: string;

    @ManyToOne(type => Generation, generation =>  generation.moves)
    @JoinColumn({name: "generation_id"})
    generation: Generation;

    @ManyToOne(type => Type, type =>  type.moves)
    @JoinColumn({name: "type_id"})
    type: Type;

    @OneToMany(type => PokemonMove, pokemonToMove => pokemonToMove.move)
    pokemonMoves?: PokemonMove[];
}

@Entity("pokemon_stat")
export class PokemonStat {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("varchar", { length: 3, default: 0,  comment: "HP" })
    hp: string;

    @Column("varchar", { length: 3, default: 0,  comment: "攻击" })
    attack: string;

    @Column("varchar", { length: 3, default: 0,  comment: "防御" })
    defense: string;

    @Column("varchar", { length: 3, default: 0,  comment: "速度" })
    speed: string;

    @Column("varchar", { name: "special_attack", length: 3, default: 0, comment: "特攻" })
    specialAttack: string;

    @Column("varchar", { name: "special_defense", length: 3, default: 0, comment: "特防" })
    specialDefense: string;
}

@Entity("pokemon_family")
export class PokemonFamily {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "simple-array", name: "family_members", comment: "家族成员" })
    familyMembers: string[];

    @OneToMany(type => Pokemon, pokemon => pokemon.family)
    pokemons: Pokemon[];
}

@Entity()
export class Pokemon {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("varchar", { name: "ndex", length: 5, unique: true, comment: "全国编号" })
    ndex: string;

    @Column("varchar", { name: "poke_name", length: 10, unique: true, comment: "名字" })
    pokeName: string;

    @Column("varchar", { name: "main_type", length: 10, comment: "主属性" })
    mainType: string;

    @Column("varchar", { name: "poke_avatar", length: 100, comment: "图像" })
    avatar: string;

    @Column("varchar", { length: 1000, name: "appearance", comment: "外貌描述" })
    appearance: string;

    @Column("int", { name: "evolution_lv", default: 0, comment: "初始,一二阶段" })
    evolutionLv: number;

    @Column("tinyint", { name: "has_mega", default: 0, comment: "是否有mega形态" })
    hasMega: boolean;

    @OneToOne(type => PokemonStat)
    @JoinColumn({name: "stats_id"})
    stats: PokemonStat;

    @ManyToOne(type => Generation, generation => generation.pokemons)
    @JoinColumn({name: "generation_id"})
    generation: Generation;

    @ManyToOne(type => PokemonFamily, pokemonFamily => pokemonFamily.pokemons)
    @JoinColumn({name: "family_id"})
    family: PokemonFamily;

    @OneToMany(type => PokemonMega, pokemonMega => pokemonMega.pokemon)
    megas: PokemonMega[];

    @OneToMany(type => PokemonMove, pokemonToMove => pokemonToMove.pokemon)
    pokemonMoves?: PokemonMove[];

    @ManyToMany(type => User, user => user.pokemons)
    users: User[];

    @ManyToMany(type => Type, type => type.pokemons)
    @JoinTable({
        name: "pokemon_type_mapping",
        joinColumn: {
            name: "pokemon_id",
            referencedColumnName: "id"
        },
        inverseJoinColumn: {
            name: "type_id",
            referencedColumnName: "id"
        }
    })
    types: Type[];
}

@Entity("pokemon_mega")
export class PokemonMega {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("varchar", { name: "mega_name", length: 10, unique: true, comment: "名字" })
    megaName: string;

    @Column("varchar", { name: "mega_avatar", length: 100, default: "", comment: "图像" })
    megaAvatar: string;

    @ManyToOne(type => Pokemon, pokemon => pokemon.megas)
    @JoinColumn({name: "pokemon_id"})
    pokemon: Pokemon;
}

@Entity("pokemon_move_mapping")
export class PokemonMove {
    @Column("varchar", { name: "learn_by", length: 10, comment: "技能学习途径" })
    learnBy: string;

    @ManyToOne(type => Pokemon, pokemon => pokemon.pokemonMoves, { primary: true })
    @JoinColumn({name: "pokemon_id"})
    pokemon: Pokemon;

    @ManyToOne(type => Move, move => move.pokemonMoves, { primary: true })
    @JoinColumn({name: "move_id"})
    move: Move;
}