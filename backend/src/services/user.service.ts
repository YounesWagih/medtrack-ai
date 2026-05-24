import * as userRepo from "../repositories/user.repository.js";

export function findById(id: string) {
    return userRepo.findById(id);
}
