import { compareSync, hashSync  } from 'bcrypt'
export const generateHush =(plainText:string,salt:number=parseInt(process.env.SALT!)):string => {
return hashSync(plainText,salt);
};
export const compareHush =(plainText:string,hushValue:string):boolean => {
return compareSync(plainText,hushValue);
};  