import { Redirect } from 'expo-router';
export default function WelcomeScreen(){return <Redirect href={{pathname:'/help',params:{intro:'1'}}}/>;}
