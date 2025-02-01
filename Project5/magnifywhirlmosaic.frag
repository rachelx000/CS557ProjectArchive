// make this 120 for the mac:
#version 330 compatibility

// uniform variables for project #5:
uniform sampler2D uImageUnit;
uniform float	  uSc, uTc, uRad;
uniform float     uMag;
uniform float	  uWhirl;
uniform float	  uMosaic;

in vec2 vST;

void
main( )
{
	// change the fragment's (s,t) so that it is with respect to the center (uSc,uTc) of the Magic Lens:
	// (Cartesian to Polar Coodinates)
	vec2 st = vST - vec2( uSc, uTc );
	float r = length( st );					// distance between the current fragment and the lens center

	if ( r > uRad)
	{
		vec3 rgb = texture( uImageUnit, vST ).rgb;
		gl_FragColor = vec4( rgb, 1. );
	}
	else
	{
		// Magnifying:
		// division used here because the magnification replaces the current fragment with one closer to the lens center.
		r /= uMag;

		// Whirling:
		float theta = atan( st.t, st.s );
		theta = theta - uWhirl * r;			// whirling adds more rotations to theta based on the distance to center

		// Restoring (s, t): (Polar to Cartesian)
		st = r * vec2( cos(theta), sin(theta) );
		st += vec2( uSc, uTc );


		// Mosaicing:
		// determine which block the fragment belongs to
		int numins = int( st.s / uMosaic );
		int numint = int( st.t / uMosaic );
		float sc = numins * uMosaic + (uMosaic * 0.5);		// the center of the block
		float tc = numint * uMosaic + (uMosaic * 0.5);
		// for this entire block of pixels, we are only going to sample the texture at its center (sc,tc):
		st = vec2( sc, tc );

		// Use st to lookup a color in the image texture:
		vec3 rgb = texture( uImageUnit, st ).rgb;
		gl_FragColor = vec4( rgb , 1.);
	}

	
}

