#version 330 compatibility

flat out vec3 vNormal;
flat out vec3 vEyeDir;
flat out vec3 vMC;

/* out vec3 vNormal;
out vec3 vEyeDir;
out vec3 vMC; */

uniform float uAmp, uFreq;

const float PI = 3.14159265;
const float LENGTH = 5.;

void
main( )
{   
    // simulate the sidewinding movement of the snake
    vMC = gl_Vertex.xyz;
    vMC.z += uAmp * sin( 2*PI*uFreq*vMC.x/LENGTH );
    // contract the x-coordinates of each vertex to maintain the original x-length
    float k = 2.0 * PI * uFreq / LENGTH;
    float arcCorrection = 1.0 / (1.0 + 0.25 * (uAmp * k) * (uAmp * k));
    vMC.x *= arcCorrection;

    vec3 ECposition = ( gl_ModelViewMatrix * vec4( vMC, 1 ) ).xyz;
    vEyeDir = ECposition - vec3(0.,0.,0.);                                  // vector from eye to pt
    // vNormal = normalize( gl_NormalMatrix * gl_Normal );                  // keep normal vectors in object space
    vNormal = normalize( gl_Normal );                           
    gl_Position = gl_ModelViewProjectionMatrix * vec4( vMC, 1 );
}