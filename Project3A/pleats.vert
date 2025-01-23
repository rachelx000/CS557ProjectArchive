#version 330 compatibility

// lighting uniform variables -- these can be set once and left alone:
uniform float	uLightX, uLightY, uLightZ;				// lighting position

// uniform variables for Project #3:
uniform float	uA, uP;		// variables for the sine wave function

// out variables to be interpolated in the rasterizer and sent to each fragment shader:
out  vec3  vN;	  // normal vector
out  vec3  vL;	  // vector from point to light
out  vec3  vE;	  // vector from point to eye

const float TWO_PI = 2. * 3.1415926535897932384626433832795;
const float Y0 = 1.;

void
main( )
{	
	// Calculate the new height of the vertex defined by the sine wave equation:
	vec3  vert = gl_Vertex.xyz;
	float z = uA * ( Y0 - vert.y ) * sin( TWO_PI * vert.x / uP );		// Frequency = TWO_PI / Period
	vert.z += z ;	// displace the vertex
	
	// Obtain the normal vector of the displaced vertex:
	// calculate the tangent slope by taking the derivatives
	float dzdx = uA * ( Y0 - vert.y ) *  ( TWO_PI / uP ) * cos( TWO_PI * vert.x / uP );
	float dzdy = -uA * sin( TWO_PI * vert.x / uP );
	vec3  Tx = vec3( 1., 0., dzdx );
	vec3  Ty = vec3( 0., 1., dzdy );
	// cross product to get a normal vector
	vN = normalize( gl_NormalMatrix * cross( Tx, Ty ) );
	// vN = normalize( cross( Tx, Ty ) );

	// Setting up the light:
	vec4 ECposition = gl_ModelViewMatrix * vec4( vert, 1. );	// eye coordinate position
	vec3 LightPosition = vec3( uLightX, uLightY, uLightZ );		// light coordinate position
	vL = normalize( LightPosition - ECposition.xyz );           // vector from the point to the light position
	vE = normalize( vec3( 0., 0., 0. ) - ECposition.xyz );		// vector from the point to the eye position

	gl_Position = gl_ModelViewProjectionMatrix * vec4( vert, 1. );
}
