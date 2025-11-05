import React from 'react';
import {NativeRouter, Route, Routes} from 'react-router-native';
import {Layout} from '../components/layout/Layout';
// import {Register} from '../screens/Register';
import {Home} from '../screens/Home';
import {routes} from "./routes";
import Toast from "react-native-toast-message";
import Login from "../screens/Login";


export const Router = () => (
  <NativeRouter>
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index path={routes.login} element={<Login />} />
        <Route path={routes.home} element={<Home />} />
      </Route>
    </Routes>
    <Toast/>
  </NativeRouter>
);
