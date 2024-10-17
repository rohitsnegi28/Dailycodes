Thanks for providing the additional information. The error you're seeing now is different from the previous one, but it's still related to your routing configuration. Let's analyze and fix this issue:

Error message: "[FasatPublicRoute] is not a <Route> component. All component children of <Routes> must be a <Route> or <React.Fragment>"

This error occurs because you're using custom route components (`FasatPublicRoute` and `FasatProtectedRoute`) directly inside the `<Routes>` component, which is not allowed in React Router v6+.

To fix this, you need to modify your routing structure. Here's how you can adjust your code:

1. Replace `FasatPublicRoute` and `FasatProtectedRoute` with standard `<Route>` components.
2. Move the logic for public and protected routes into the `element` prop of each `<Route>`.

Here's a refactored version of your routing code:

```jsx
<Suspense fallback={<FallbackComponent />}>
  <Routes>
    <Route path="/" exact element={<FasatHome isExternalUser={/* your prop */} />} />
    <Route path="/signin-oidc" exact element={<FasatHome />} />
    {publicRoutes.map((route) => (
      <Route
        key={route.id}
        path={route.path}
        exact={route.exact}
        element={<PublicRouteWrapper component={route.component} routeConfig={route} />}
      />
    ))}
    {userClaim && protectedRoute.map((route) => (
      <Route
        key={route.id}
        path={route.path}
        exact={route.exact}
        element={
          <ProtectedRouteWrapper
            component={route.component}
            routeConfig={route}
            aclKey={route.aclKey[0]}
            userClaim={userClaim}
          />
        }
      />
    ))}
    <Route path="*" element={isBatchProcessing ? <FasatHome /> : <div>Not Found</div>} />
  </Routes>
</Suspense>
```

In this refactored version:

1. We use standard `<Route>` components for all routes.
2. For public and protected routes, we create wrapper components (`PublicRouteWrapper` and `ProtectedRouteWrapper`) that handle the logic previously contained in `FasatPublicRoute` and `FasatProtectedRoute`.
3. These wrapper components are passed as the `element` prop to the `<Route>` components.

You'll need to create these wrapper components:

```jsx
const PublicRouteWrapper = ({ component: Component, routeConfig, ...rest }) => (
  <Component {...rest} routeConfig={routeConfig} />
);

const ProtectedRouteWrapper = ({ component: Component, routeConfig, aclKey, userClaim, ...rest }) => (
  // Add your authentication logic here
  <Component {...rest} routeConfig={routeConfig} />
);
```

This structure should resolve the error while maintaining the functionality of your public and protected routes. Make sure to adjust the props and logic in the wrapper components according to your specific requirements.​​​​​​​​​​​​​​​​