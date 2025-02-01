#version 330 compatibility

out vec3 vNormal;
out vec3 vEyeDir;
out vec3 vMC;

void
main( )
{
    vMC = gl_Vertex.xyz;
    vec3 ECposition = ( gl_ModelViewMatrix * gl_Vertex).xyz;
    vEyeDir = ECposition - vec3(0.,0.,0.);                      // vector from eye to pt
    // vNormal = normalize( gl_NormalMatrix * gl_Normal );
    vNormal = normalize( gl_Normal );                           // keep normal vectors in object space

    gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
}