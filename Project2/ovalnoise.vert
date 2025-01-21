#version 330 compatibility

// lighting uniform variables -- these can be set once and left alone:
uniform float   uKa, uKd, uKs;	 // coefficients of each type of lighting -- make sum to 1.0
uniform float   uShininess;		 // specular exponent

// uniform variables for Project #2 -- these should be set every time Display( ) is called:

uniform float   uAd, uBd;
uniform float	uTol;

// out variables to be interpolated in the rasterizer and sent to each fragment shader:

out  vec2  vST;	  // (s,t) texture coordinates
out  vec3  vN;	  // normal vector
out  vec3  vL;	  // vector from point to light
out  vec3  vE;	  // vector from point to eye
out  vec3  vMC;	  // model coordinates

// where the light is:
const vec3 LIGHTPOSITION = vec3(  5., 5., 0. );

void
main( )
{
	vST = gl_MultiTexCoord0.st;
	vMC = gl_Vertex.xyz;
	vec4 ECposition = gl_ModelViewMatrix * gl_Vertex;	// eye coordinate position
	vN = normalize( gl_NormalMatrix * gl_Normal );      // normal vector
	vL = LIGHTPOSITION - ECposition.xyz;	            // vector from the point to the light position
	vE = vec3( 0., 0., 0. ) - ECposition.xyz;			// vector from the point to the eye position
	gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
}
