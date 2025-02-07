#version 330 compatibility

flat in vec3 vNormal;
flat in vec3 vEyeDir;
flat in vec3 vMC;

/* in vec3 vNormal;
in vec3 vEyeDir;
in vec3 vMC; */

uniform samplerCube uRefractUnit;
uniform samplerCube uReflectUnit;
uniform float uEtaRed, uEtaGreen, uEtaBlue, uMix;

void main( )
{   
    vec3 normal = normalize( gl_NormalMatrix*vNormal );
    vec3 eye = normalize( vEyeDir );

    // Calculate the reflection color:
    vec3 reflectVector = reflect( eye, normal );
    vec3 reflectColor = texture( uReflectUnit, reflectVector ).rgb;

    // Splitting refraction color with chromatic aberration: 
    vec3 refractVecR = refract( eye, normal, uEtaRed );
    vec3 refractVecG = refract( eye, normal, uEtaGreen );
    vec3 refractVecB = refract( eye, normal, uEtaBlue );

    float R = texture( uRefractUnit, refractVecR ).r;
    float G = texture( uRefractUnit, refractVecG ).g;
    float B = texture( uRefractUnit, refractVecB ).b;

    // Add specular and diffuse light:

 
    vec3 refractColor = vec3( 0., 0., 0 );
    if( all( equal( max(refractVecR, max( refractVecB, refractVecG) ), vec3(0.,0.,0.) ) ) )
        refractColor = reflectColor;
    else
    {   
        refractColor = vec3( R, G, B );
    }
    vec3 color = mix( refractColor, reflectColor, uMix );
    gl_FragColor = vec4( color, 1. );

}