#version 330 compatibility

// lighting uniform variables -- these can be set once and left alone:
uniform float   uKa, uKd, uKs;	 // coefficients of each type of lighting -- make sum to 1.0
uniform float   uShininess;		 // specular exponent

// uniform variables for Project #1 -- these should be set every time Display( ) is called:

uniform float   uAd, uBd;
uniform float	uTol;

// in variables from the vertex shader and interpolated in the rasterizer:

in  vec2  vST;					// texture coords
in  vec3  vN;                   // normal vector
in  vec3  vL;                   // vector from point to light
in  vec3  vE;                   // vector from point to eye
in  vec3  vMC;					// model coordinates

// constant variables
const vec3 OBJECTCOLOR          = vec3( 1.,	   0.875, 0.871 );           // color to make the object
const vec3 ELLIPSECOLOR         = vec3( 0.416, 0.486, 0.635 );			 // color to make the ellipse
const vec3 SPECULARCOLOR        = vec3( 1., 1., 1. );

void
main( )
{
	float s = vST.s;
	float t = vST.t;

	// blend OBJECTCOLOR and ELLIPSECOLOR by using the ellipse equation to decide how close
	// this fragment is to the ellipse border:
	
	int numins = int( s / uAd );
	int numint = int( t / uBd );

	// calculate the center of the current grid
	float Ar = uAd/2;
	float Br = uBd/2;
	float sc = numins*uAd + Ar;
	float tc = numint*uBd + Br;

	vec3 myColor = OBJECTCOLOR.rgb;
	float d = (pow((s-sc)/Ar, 2.) +  pow((t-tc)/Br, 2.));
	float m = smoothstep(1.-uTol, 1.+uTol, d);
	if( d <= 1 )
	{
		myColor = ELLIPSECOLOR.rgb;
	}
	if ((1.-uTol <= d) && (d <= 1.+uTol))
	{
		float bt = smoothstep(1.-uTol, 1.+uTol, d);
		myColor = mix(ELLIPSECOLOR.rgb, OBJECTCOLOR.rgb, bt);
	}

	// apply the per-fragmewnt lighting to myColor:

	vec3 Normal = normalize(vN);
	vec3 Light  = normalize(vL);
	vec3 Eye    = normalize(vE);

	vec3 ambient = uKa * myColor;

	float dd = max( dot(Normal,Light), 0. );       // only do diffuse if the light can see the point
	vec3 diffuse = uKd * dd * myColor;

	float ss = 0.;
	if( dd > 0. )								   // only do specular if the light can see the point
	{
		vec3 ref = normalize(  reflect( -Light, Normal )  );
		ss = pow( max( dot(Eye,ref),0. ), uShininess );
	}
	vec3 specular = uKs * ss * SPECULARCOLOR.rgb;
	gl_FragColor = vec4( ambient + diffuse + specular,  1. );
}

