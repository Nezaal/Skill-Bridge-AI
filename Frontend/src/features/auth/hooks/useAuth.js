import { useContext } from "react";
import { Authcontext } from "../auth.context";
import { login, register, logout, getme } from "../services/auth.api";


export const  useAuth = () =>{

    const context = useContext(Authcontext)

    const { user, setUser, loading, setLoading} = context

    const handleLogin = async ({email, password}) =>{
        try{

            setLoading(true)
            const  data = await login({email, password})
            setUser(data.user)
        }catch(err){
            throw err
        }finally{

            setLoading(false)
        }
    }

    const handleRegister = async ({username, email, password}) =>{
        try{

            setLoading(true)
            const data = await register({username, email, password})
            setUser(data.user)
        }catch(err){
            throw err
        }finally{

            setLoading(false)
        } 
    }

    const handleLogout = async () =>{
        try{

            setLoading(true)
            
            const data =  await logout()
            setUser(null)
        }catch(err){
            throw err
        }finally{

            setLoading(false)
        }
    }


    return {user, loading,handleLogin, handleRegister, handleLogout}

}